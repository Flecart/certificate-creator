import type { NextApiRequest, NextApiResponse } from 'next'
import { isConditionalExpression } from 'typescript';
import { createVenue, uploadImageToEventbrite } from './evenbriteApi';
import { ConfigRequest, generateImage } from '../certificate/createOnFlyTemplatePng';
import { imageConfigBackgroundScuro } from './eventImage';

type Data = {
    data?: string,
    error?: string
}

const token = 'LEHDDIQTJYXP5DJ6P6EC'; // Replace with your actual OAuth token for Eventbrite

const createEventOnEventbrite = async (eventDetails: 
  { title: any; timezone: any; date: string; hour: string; 
    currency: any; venue_id: any; description: string; logo_id:string}, organizationId: any) => {
    const eventUrl = `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/`;
    console.log('createevent1')

    

    // Function to format the date into the desired string format
    function formatEventTime(date: Date) {
      return date.toISOString().replace('.000', '').substring(0, 19) + 'Z';
    }

    // https://www.eventbriteapi.com/v3/organizations/797184359013/events/?token=LEHDDIQTJYXP5DJ6P6EC
    const eventPayload = {
      event: {
        name: {
          html: eventDetails.title
        },
        start: {
          timezone: eventDetails.timezone,
          utc: formatEventTime(new Date(`${eventDetails.date}T${eventDetails.hour}:00Z`))
        },
        end: {
          timezone: eventDetails.timezone,
          utc: (() => {
            // Create a date object for the start time
            const startDate = new Date(`${eventDetails.date}T${eventDetails.hour}:00Z`);
            // Add 2 hours
            startDate.setHours(startDate.getHours() + 2);
            // Use the formatter to get the correct format
            return formatEventTime(startDate);
          })()
        },
        currency: eventDetails.currency,
        venue_id: eventDetails.venue_id.toString(),
        logo_id: eventDetails.logo_id.toString(),
        description: {
          html: eventDetails.description
        }
      }
    };

  try{
    console.log('createevent2 '+ eventUrl  + " " + JSON.stringify(eventPayload))

    const eventResponse = await fetch(eventUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
    });
    console.log("createEent Status: " + eventResponse.status)
    let response = JSON.parse(await eventResponse.text());
    console.log(response)
    return response
  }catch(e){
    console.log(JSON.stringify(e))
    throw e;
  }
}

const createTicketClass = async (eventId: any, ticketDetails: { name: any; quantity: any; cost: any; donation:boolean; free:boolean;}) => {
    const ticketUrl = `https://www.eventbriteapi.com/v3/events/${eventId}/ticket_classes/`;

    const ticketPayload = {
        ticket_class: {
            name: ticketDetails.name,
            quantity_total: ticketDetails.quantity,
            // cost: ticketDetails.cost,
            donation: ticketDetails.donation,
            free: ticketDetails.free
        }
    };
    console.log('createTicketClass '+ ticketDetails.name)

    const ticketResponse = await fetch(ticketUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketPayload)
    });
    console.log(ticketResponse.status)
    let responseJson = await ticketResponse.text()
    console.log("createTicketClass "+ responseJson)

    return responseJson;
}

const publishEvent = async (eventId: any) => {
    const publishUrl = `https://www.eventbriteapi.com/v3/events/${eventId}/publish/`;

    const publishResponse = await fetch(publishUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    let result = JSON.parse(await publishResponse.text())
    console.log("publish "+ publishResponse.status + " " + result )
    return result;
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const eventDetails = req.body; // Event details are expected in the request body
    const organizationId = '797184359013';//'514868749047'; // '42316102643'; // Replace with your actual organization ID
    
    const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

    // make a defensive copy of imageConfig
    let imageConfigCurrent = JSON.parse(JSON.stringify(imageConfigBackgroundScuro))
    imageConfigCurrent["textConfigs"]["title"]["defaultTextValue"] = eventDetails.title

    let imagePath = "/public/ltf/cities/" + eventDetails.locationCity.replace(".","").toLowerCase() + "-scuro.png";

    // verify that the file exists
    const fs = require('fs');
    if (!fs.existsSync(process.cwd() + imagePath)) {
      // TODO download an image? use a default template image that works with anything? to decide
      imagePath = "/public/ltf/cities/bologna-scuro.png";
    }

    // TODO configurare il background con l'immagine della  eventDetails.locationName
    imageConfigCurrent["documentConfig"]["backgroundImage"]["url"] = imagePath;

    let eventDate = eventDetails.date.split("-");
    imageConfigCurrent["textConfigs"]["dateDayOfMonth"]["defaultTextValue"] = eventDetails.date.split("-")[2] + " " + months[parseInt(eventDate[1], 10) - 1]
    imageConfigCurrent["textConfigs"]["dateHour"]["defaultTextValue"] = "h " + eventDetails.hour.replace(':','.')
    imageConfigCurrent["textConfigs"]["eventLocation"]["defaultTextValue"] = eventDetails.locationName


    const logo_id = await uploadImageToEventbrite(await generateImage( imageConfigCurrent as unknown as ConfigRequest), token)
    eventDetails.logo_id = logo_id

    let venueId = await createVenue(organizationId, eventDetails.locationName, token, {})
    console.log("venueId " + venueId)

    console.log("create an event")
    // Step 1: Create Event
    eventDetails.venue_id = venueId
    eventDetails.currency = "EUR"
    const eventResponse = await createEventOnEventbrite(eventDetails, organizationId);

    if (eventResponse.error) throw new Error(eventResponse.error.description);
    console.log("create ticket class")

      // Step 2: Create Ticket Classes
      // Free ticket
      const freeTicketDetails = {
        name: "Incontra la Community",
        quantity: 20,
        cost: "EUR,0000" ,
        free: true,
        donation: false
    };
    await createTicketClass(eventResponse.id, freeTicketDetails);

    const freeTicketDetails2 = {
      name: "Dona e Join il meetup!",
      quantity: 10,
      cost: "EUR,0000" ,
      free: false,
      donation: true
  };
  await createTicketClass(eventResponse.id, freeTicketDetails2);


  // ignore
        console.log("create ticket class2")

      // Donation tickets
      // for (const amount of donationAmounts) {
      //     const donationTicketDetails = {
      //         name: `Dona ${amount / 100}`,
      //         quantity: 100,
      //         cost: `EUR,${amount}`
      //     };
      //     await createTicketClass(eventResponse.id, donationTicketDetails);
      // }

    console.log("publish event")
    // publishEvent(eventResponse.id);

    console.log("go to your events: https://www.eventbrite.it/organizations/events/draft")


      return res.status(200).json({ data: `Event created and published successfully with ID: ${eventResponse.id}` });
  } catch (error: any) {
      return res.status(400).json({ error: error.message ?? "Error in creating and publishing event" });
  }
}

