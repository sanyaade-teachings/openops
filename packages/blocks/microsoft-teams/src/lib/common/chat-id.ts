import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Chat, ConversationMember } from '@microsoft/microsoft-graph-types';
import {
  BlockPropValueSchema,
  DropdownOption,
  Property,
} from '@openops/blocks-framework';
import { getMicrosoftGraphClient } from './get-microsoft-graph-client';
import { microsoftTeamsAuth } from './microsoft-teams-auth';
import { parseMsPaginatedData } from './parse-ms-paginated-data';

export const chatId = Property.Dropdown({
  displayName: 'Chat ID',
  refreshers: ['auth'],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account first and select team.',
        options: [],
      };
    }
    const authValue = auth as BlockPropValueSchema<typeof microsoftTeamsAuth>;
    const client = getMicrosoftGraphClient(authValue.access_token);

    const options: DropdownOption<string>[] = [];

    // Pagination : https://learn.microsoft.com/en-us/graph/sdks/paging?view=graph-rest-1.0&tabs=typescript#manually-requesting-subsequent-pages
    // List Chats : https://learn.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-1.0&tabs=http
    const response: PageCollection = await client
      .api('/chats')
      .expand('members')
      .get();

    await parseMsPaginatedData(client, response, options, populateChatOptions);

    return {
      disabled: false,
      options: options,
    };
  },
});

const CHAT_TYPE = {
  oneOnOne: '1 : 1',
  group: 'Group',
  meeting: 'Meeting',
  unknownFutureValue: 'Unknown',
};

async function populateChatOptions(
  options: DropdownOption<string>[],
  elem: Chat,
) {
  const chatName =
    elem.topic ??
    elem.members
      ?.filter((member: ConversationMember) => member.displayName)
      .map((member: ConversationMember) => member.displayName)
      .join(',');

  options.push({
    label: `(${CHAT_TYPE[elem.chatType!]} Chat) ${chatName || '(no title)'}`,
    value: elem.id!,
  });
}
