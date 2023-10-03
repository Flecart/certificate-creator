import type { NextApiRequest, NextApiResponse } from 'next'

import supabaseClient from '@/supabaseClient';
import { ConfigRequest } from '@/models/requests';
import * as configService from '@/services/configService';

const Ajv = require('ajv');

type Data = {
    data?: string,
    error?: string
}

const schema = {
    "type": "object",
    "properties": {
      "bucketName": {
        "type": "string"
      },
      "pdfconfig": {
        "type": "object",
        "properties": {
          "date": {
            "$ref": "#/definitions/dateConfig"
          },
          "name": {
            "$ref": "#/definitions/nameConfig"
          }
        },
        "required": ["date", "name"]
      },
      "peopleUrl": {
        "type": "string"
      }
    },
    "required": ["bucketName", "pdfconfig", "peopleUrl"],
    "definitions": {
      "fontPosition": {
        "type": "object",
        "properties": {
          "fontWidth": {
            "type": "number"
          },
          "position": {
            "type": "object",
            "properties": {
              "x": {
                "type": "number"
              },
              "y": {
                "type": "number"
              }
            },
            "required": ["x", "y"]
          },
          "boxLength": {
            "type": "number"
          }
        },
        "required": ["fontWidth", "position", "boxLength"]
      },
      "dateConfig": {
        "type": "object",
        "properties": {
          "year": {
            "type": "integer"
          },
          "fontPosition": {
            "$ref": "#/definitions/fontPosition"
          }
        },
        "required": ["year", "fontPosition"]
      },
      "nameConfig": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "fontPosition": {
            "$ref": "#/definitions/fontPosition"
          }
        },
        "required": ["fontPosition"]
      }
    }
}
  
// Create an instance of the Ajv validator
const ajv = new Ajv();

// Compile the schema
const validate = ajv.compile(schema);

/// updates the person list from the outside url
/// @param list the list name to update
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') {
        return res.status(400).json({error: `Only POST method is allowed`});
    }
    const name = req.query.list as string || ''
    // TODO: make request to present lists

    // validate post date using jsonschema format
    const bodyData = req.body;
    if (!validate(bodyData)) {
        console.log(validate.errors);
        return res.status(400).json({error: `Invalid input format, check the documentation`});
    }

    const parsedData = bodyData as ConfigRequest;

    const { data, error }  = await configService.updateConfig(name, parsedData);

    if (error) {
        return res.status(400).json({error: error.message});
    }

    return res.status(200).json({data: `Successfully updated for ${bodyData.bucketName} config list`});
}
