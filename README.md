# certificate-creator
This project creates compleation-certificates based on a template.


## How it works

in this moment all the code is in pages/api/certificate/create.ts.
It works by storing the generated certificates in a supabase bucket.


```
npm run dev
```


Open address
```
http://localhost:3000/api/certificate/createAdmin?fullName=Nome%20Cognome&keySuperUser=PUTYOURKEY

http://localhost:3000/api/certificate/createAdmin?fullName=Nome%20Cognome&paramSignedSuperUser=986f862cdasjndj465c98fbd25eb0480b01d7b81a71d3c199eec8623ff501b8
```

### Update the config file

If you want to make the request with cURL:

```bash
curl -H "Content-Type: application/json" --request POST  --data @body.json [host_base_url]/api/certificate/config?list=list-name&&keySuperUser=<key-placeholder>
```

### upload a template image

```bash


curl  -F upload=@image.jpeg "<host_base_url>/api/certificate/template?list=list-name&keySuperUser=<key-placeholder>"
```



### on the fly template


curl -X POST http://localhost:3000/api/certificate/createOnFlyTemplate \
     -H "Content-Type: application/json" \
     -d '{
   "textConfigs":{
      "event":{
         "defaultTextValue":"meet THE FUTURE",
         "textProperties":{
            "fontWidth":55,
            "position":{
               "x":56,
               "y":47
            },
            "boxLength":284,
            "fontName":"AtypDisplay-Bold.otf",
            "fontColor":"white"
         }
      },
      "title":{
         "defaultTextValue":"Mia Città",
         "textProperties":{
            "fontWidth":36,
            "position":{
               "x":383,
               "y":72
            },
            "boxLength":670,
            "fontName":"AtypDisplay-BoldItalic.otf",
            "fontColor":"white"
         }
      },
      "dateDayOfWeek":{
         "defaultTextValue":"Venerdì",
         "textProperties":{
            "fontWidth":29,
            "position":{
               "x":383,
               "y":126
            },
            "boxLength":670,
            "fontName":"AtypDisplay-BoldItalic.otf",
            "fontColor":"#000000"
         }
      },
      "dateDayMethod":{
         "defaultTextValue":"5 Maggio",
         "textProperties":{
            "fontWidth":24,
            "position":{
               "x":383,
               "y":172
            },
            "boxLength":670,
            "fontName":"UberMoveBold.otf",
            "fontColor":"#000000"
         }
      },
      "dateHour":{
         "defaultTextValue":"h 19.30",
         "textProperties":{
            "fontWidth":19,
            "position":{
               "x":383,
               "y":206
            },
            "boxLength":670,
            "fontName":"AtypDisplay-Light.otf",
            "fontColor":"#000000"
         }
      },
      "eventDescription":{
         "defaultTextValue":"Networking Drinks",
         "textProperties":{
            "fontWidth":20,
            "position":{
               "x":383,
               "y":251
            },
            "boxLength":670,
            "fontName":"UberMoveMedium.otf",
            "fontColor":"white"
         }
      },
      "eventLocation":{
         "defaultTextValue":"WOKO Studentische Wohngenossenschaft,  Freilagerstrasse 90",
         "textProperties":{
            "fontWidth":12,
            "position":{
               "x":383,
               "y":290
            },
            "boxLength":670,
            "fontName":"UberMoveMedium.otf",
            "fontColor":"white"
         }
      }
   },
   "imageConfigs":{
      "logoRightTop":{
         "url":"/public/ltf/LTF_Logo_Bianco.png",
         "position":{
            "x":1108,
            "y":43
         },
         "size":{
            "width":39,
            "height":43
         }
      }
   },
   "polygonConfig":{
      "divider":{
         "x":367,
         "y":61,
         "height":264,
         "width":4
      }
   },
   "documentConfig":{
      "size":[
         1200,
         627
      ],
      "layout":"portrait",
      "backgroundImage":{
         "url":"/public/ltf/cities/london.jpeg",
         "position":{
            "x":0,
            "y":0
         },
         "size":{
            "width":1200,
            "height":627
         },
         "padding":{
            "bottom":20
         }
      }
   }
}' -o abc.pdf