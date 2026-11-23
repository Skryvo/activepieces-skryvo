import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { brandProp, channelsProp, given, skryvoAuth, skryvoRequest } from '../common';

export const schedulePost = createAction({
  auth: skryvoAuth,
  name: 'schedule_post',
  displayName: 'Schedule a Post',
  description: 'Schedules approved text to connected channels. Use it only after the person approved the words.',
  props: {
    text: Property.LongText({ displayName: 'Text', description: 'The exact words the person approved.', required: true }),
    channel_ids: channelsProp,
    at: Property.DateTime({
      displayName: 'Publish At',
      description: 'Moves to the next quarter hour. Left empty, the post goes out in about five minutes.',
      required: false,
    }),
    image_url: Property.ShortText({ displayName: 'Image URL', description: 'One picture for every channel.', required: false }),
    link: Property.ShortText({ displayName: 'Link', description: 'A web page the post points to.', required: false }),
    brand_id: brandProp,
    tiktok_privacy: Property.StaticDropdown({
      displayName: 'TikTok Audience',
      description: 'Required for a TikTok channel; TikTok asks the person to choose it for every post.',
      required: false,
      options: {
        options: [
          { label: 'Everyone', value: 'PUBLIC_TO_EVERYONE' },
          { label: 'Followers', value: 'FOLLOWER_OF_CREATOR' },
          { label: 'Friends', value: 'MUTUAL_FOLLOW_FRIENDS' },
          { label: 'Only me', value: 'SELF_ONLY' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { tiktok_privacy, ...rest } = propsValue;
    const { posts } = await skryvoRequest<{ posts: unknown[] }>(auth.secret_text, HttpMethod.POST, '/posts', {
      ...given(rest),
      ...(tiktok_privacy ? { tiktok: { privacy: tiktok_privacy } } : {}),
    });
    return posts;
  },
});
