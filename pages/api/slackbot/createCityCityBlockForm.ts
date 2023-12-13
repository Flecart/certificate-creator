import type { NextApiRequest, NextApiResponse } from 'next'

type SlackCommandRequest = {
    trigger_id: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { trigger_id }: SlackCommandRequest = req.body;

        // Define the form modal
        const modal = {
            trigger_id: trigger_id,
            view: {
                type: 'modal',
                callback_id: 'create-event-form',
                title: {
                    type: 'plain_text',
                    text: 'Create Event'
                },
                submit: {
                    type: 'plain_text',
                    text: 'Submit'
                },
                blocks: [
                    {
                        type: 'input',
                        block_id: 'title_block',
                        element: {
                            type: 'plain_text_input',
                            action_id: 'title',
                            placeholder: {
                                type: 'plain_text',
                                text: 'Enter event title, e.g., LTF: Meet the Future, Zurich Aperitivo'
                            }
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Event Title'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'city_block',
                        element: {
                            type: 'static_select',
                            action_id: 'city',
                            placeholder: {
                                type: 'plain_text',
                                text: 'Select a city'
                            },
                            options: [
                                { text: { type: 'plain_text', text: 'Milano' }, value: 'Milano' },
                                { text: { type: 'plain_text', text: 'Londra' }, value: 'Londra' },
                                // Add other cities here
                            ]
                        },
                        label: {
                            type: 'plain_text',
                            text: 'City'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'date_block',
                        element: {
                            type: 'datepicker',
                            action_id: 'date',
                            placeholder: {
                                type: 'plain_text',
                                text: 'Select a date'
                            },
                            initial_date: new Date().toISOString().split('T')[0], // Defaults to today's date
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Date'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'time_block',
                        element: {
                            type: 'timepicker',
                            action_id: 'time',
                            placeholder: {
                                type: 'plain_text',
                                text: 'Select a time'
                            },
                            initial_time: '18:00' // Default time
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Time'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'description_block',
                        element: {
                            type: 'plain_text_input',
                            action_id: 'description',
                            multiline: true,
                            placeholder: {
                                type: 'plain_text',
                                text: 'Enter a description for the event'
                            }
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Description'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'maps_link_block',
                        element: {
                            type: 'plain_text_input',
                            action_id: 'maps_link',
                            optional: true,
                            placeholder: {
                                type: 'plain_text',
                                text: 'Enter Google Maps link (optional)'
                            }
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Google Maps Link'
                        }
                    }
                ]
            }
        };

        // Post the modal to Slack
        const response = await fetch('https://slack.com/api/views.open', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
            },
            body: JSON.stringify(modal)
        });

        if (!response.ok) {
            throw new Error(`Failed to open modal: ${response.statusText}`);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
