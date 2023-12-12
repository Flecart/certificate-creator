import FormData from 'form-data';
import fetch from 'node-fetch';

// Eventbrite Image

const mediaUploadUrl = 'https://www.eventbriteapi.com/v3/media/upload/';

interface UploadInstructions {
    upload_data: Record<string, string>;
    upload_url: string;
    upload_token: string;
}

interface CropMask {
    top_left: { y: number; x: number };
    width: number;
    height: number;
}

export async function uploadImageToEventbrite(imageBuffer: Buffer, oauthToken: string): Promise<any> {
    try {
        const instructionsResponse = await getUploadInstructions(oauthToken);
        const uploadResponse = await uploadImage(instructionsResponse.upload_url, instructionsResponse.upload_data, imageBuffer, "image");
        const evenbriteImageNotified = await notifyEventbrite(instructionsResponse.upload_token, oauthToken);

        console.log("uploadResponse" + uploadResponse)
        console.log("uploadNotified" + JSON.stringify(evenbriteImageNotified))
        return evenbriteImageNotified.id;
    } catch (error) {
        console.error('Error uploading image to Eventbrite:', error);
        throw error;
    }
}

async function getUploadInstructions(oauthToken: string): Promise<UploadInstructions> {
  const instructionsUrl = `${mediaUploadUrl}?type=image-event-logo&token=${oauthToken}`;
  const response = await fetch(instructionsUrl);
  return response.json() as Promise<UploadInstructions>;
}

async function uploadImage(uploadUrl: string, uploadData: Record<string, string>, imageBuffer: Buffer, fileName: string): Promise<any> {
    const formData = new FormData();
    Object.keys(uploadData).forEach(key => {
        formData.append(key, uploadData[key]);
    });
    formData.append('file', imageBuffer, fileName);

    const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
    });
    console.log("uploading image.. Status: " + response.status)
    const body = await response.text()
    console.log("body uploaded " + body)
    // return JSON.parse(body);
}

async function notifyEventbrite(uploadToken: string, oauthToken: string): Promise<any> {
    const notifyUrl = `${mediaUploadUrl}?token=${oauthToken}`;
    const image_data: { upload_token: string; crop_mask: CropMask } = {
        upload_token: uploadToken,
        crop_mask: { top_left: { y: 1, x: 1 }, width: 1280, height: 640 }
    };

    const response = await fetch(notifyUrl, {
        method: 'POST',
        body: JSON.stringify(image_data),
        headers: { 'Content-Type': 'application/json' }
    });
    console.log('notifyEventbrite status: '+ response.status)
    return JSON.parse(await response.text());
}




// venue

export async function createVenue(organizationId: string, venueName: string,  token: string, address: object = {}): Promise<void> {
  const url = `https://www.eventbriteapi.com/v3/organizations/${organizationId}/venues/`;
  const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
  };

  const body = JSON.stringify({
      venue: {
          name: venueName,
          capacity: 1000,
          address: address
      }
  });

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: body
      });
      console.log('Status:', response.status);
      
      const responseData = JSON.parse(await response.text());
      console.log('Status:', response.status);
      console.log('VenueCreated: ' + responseData.id + ' Response:', responseData);
      return responseData.id
  } catch (error) {
      console.error('Error:', error);
  }
}