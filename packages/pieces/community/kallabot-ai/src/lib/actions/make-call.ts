import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { kallabotAuth } from '../..';

export const makeCall = createAction({
  name: 'make_call',
  displayName: 'Make Call',
  description: 'Initiate an outbound call using an AI voice agent',
  auth: kallabotAuth,
  props: {
    agent_id: Property.Dropdown({
      displayName: 'Agent',
      description: 'Select the AI agent that will handle the call',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://api.kallabot.com/v1/agents',
          headers: {
            'Authorization': `Bearer ${auth}`,
          },
        });

        return {
          disabled: false,
          options: response.body.agents.map((agent: any) => ({
            label: agent.name,
            value: agent.id
          }))
        };
      }
    }),
    recipient_phone_number: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description: 'The phone number to call in E.164 format (e.g., +1234567890)',
      required: true,
    }),
    sender_phone_number: Property.ShortText({
      displayName: 'Caller ID',
      description: 'The phone number to display as the caller ID in E.164 format',
      required: true,
    }),
    record: Property.Checkbox({
      displayName: 'Record Call',
      description: 'Whether to record the call for quality and training purposes',
      required: false,
      defaultValue: false,
    }),
    template_variables: Property.Object({
      displayName: 'Template Variables',
      description: 'Variables to interpolate into the agent\'s prompts',
      required: false,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.kallabot.com/v1/call',
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        agent_id: context.propsValue.agent_id,
        recipient_phone_number: context.propsValue.recipient_phone_number,
        sender_phone_number: context.propsValue.sender_phone_number,
        record: context.propsValue.record,
        template_variables: context.propsValue.template_variables,
      },
    });

    return response.body;
  },
});