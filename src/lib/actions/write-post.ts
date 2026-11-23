import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { brandProp, given, platformsProp, skryvoAuth, skryvoRequest } from '../common';

export const writePost = createAction({
  auth: skryvoAuth,
  name: 'write_post',
  displayName: 'Write a Post',
  description: "Drafts a post per platform in the brand's voice. Schedules nothing.",
  props: {
    topic: Property.ShortText({
      displayName: 'Topic',
      description: 'What the post is about, up to 200 characters: the news, the offer, who it is for.',
      required: true,
    }),
    platforms: platformsProp('Platforms', 'Up to four. One post is written for each.'),
    brand_id: brandProp,
    pictures: Property.Checkbox({
      displayName: 'Pictures',
      description: "Designs a picture in the brand's kept look with each post, using image credits. Takes about a minute.",
      required: false,
      defaultValue: false,
    }),
    tone: Property.ShortText({ displayName: 'Tone', description: 'For example friendly or professional.', required: false }),
    language: Property.ShortText({ displayName: 'Language', description: 'A language code such as en or de.', required: false }),
    audience: Property.ShortText({ displayName: 'Audience', required: false }),
    call_to_action: Property.ShortText({ displayName: 'Call to Action', required: false }),
    hashtags: Property.Array({ displayName: 'Hashtags', description: 'Up to ten, without the #.', required: false }),
    link: Property.ShortText({ displayName: 'Link', description: 'A web page the post points to.', required: false }),
  },
  async run({ auth, propsValue }) {
    return skryvoRequest(auth.secret_text, HttpMethod.POST, '/drafts', {
      ...given({ ...propsValue, pictures: undefined }),
      pictures: propsValue.pictures ?? false,
      confirmed: true,
    });
  },
});
