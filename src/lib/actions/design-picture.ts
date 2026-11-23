import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { brandProp, given, platformsProp, skryvoAuth, skryvoRequest } from '../common';

export const designPicture = createAction({
  auth: skryvoAuth,
  name: 'design_picture',
  displayName: 'Design a Picture',
  description: "Designs one picture for a post in the brand's kept look, sized for each platform. Uses image credits.",
  props: {
    text: Property.LongText({ displayName: 'Text', description: "The post's text; the picture carries its opening line.", required: true }),
    platforms: platformsProp('Platforms', 'A copy sized for each.'),
    brand_id: brandProp,
    headline: Property.ShortText({ displayName: 'Headline', description: 'Up to nine words on the picture.', required: false }),
    direction: Property.ShortText({
      displayName: 'Direction',
      description: "closer, bolder, calmer, or the person's own words.",
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return skryvoRequest(auth.secret_text, HttpMethod.POST, '/pictures', given(propsValue));
  },
});
