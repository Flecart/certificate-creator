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
curl -H "Content-Type: application/json" --request POST  --data @body.json [host_base_url]/api/certificate/config?list=list-name
```

### upload a template image

```bash

curl  -F upload=@image.jpeg [host_base_url]/api/certificate/template?list=list-name
```