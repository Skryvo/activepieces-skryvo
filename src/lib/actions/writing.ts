import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { brandProp, given, skryvoAuth, skryvoRequest } from '../common';

const option = (label: string, value: string) => ({ label, value });

export const writeEmail = createAction({
  auth: skryvoAuth,
  name: 'write_email',
  displayName: 'Write an Email',
  description: "Writes subject lines, a preheader, the body and a call to action in the brand's voice. Nothing is sent.",
  props: {
    about: Property.LongText({ displayName: 'About', description: 'What the email is about.', required: true }),
    email_type: Property.StaticDropdown({
      displayName: 'Email Type',
      required: true,
      options: {
        options: [
          option('Announcement', 'announcement'),
          option('Follow-up', 'follow_up'),
          option('Newsletter', 'newsletter'),
          option('Promotional', 'promotional'),
          option('Re-engagement', 're_engagement'),
          option('Transactional', 'transactional'),
          option('Welcome', 'welcome'),
        ],
      },
    }),
    brand_id: brandProp,
    tone: Property.ShortText({ displayName: 'Tone', required: false }),
    language: Property.ShortText({ displayName: 'Language', required: false }),
    audience: Property.ShortText({ displayName: 'Audience', required: false }),
    call_to_action: Property.ShortText({ displayName: 'Call to Action', required: false }),
    length: Property.Number({ displayName: 'Length', description: 'Body words, 100 to 1000.', required: false }),
  },
  async run({ auth, propsValue }) {
    return skryvoRequest(auth.secret_text, HttpMethod.POST, '/emails', given(propsValue));
  },
});

export const writeListing = createAction({
  auth: skryvoAuth,
  name: 'write_listing',
  displayName: 'Write a Product Listing',
  description: 'Writes a title, description and feature bullets for a marketplace from one to ten features.',
  props: {
    product: Property.ShortText({ displayName: 'Product', required: true }),
    features: Property.Array({ displayName: 'Features', description: 'One to ten.', required: true }),
    marketplace: Property.StaticDropdown({
      displayName: 'Marketplace',
      required: true,
      options: {
        options: [
          option('Amazon', 'amazon'),
          option('eBay', 'ebay'),
          option('Etsy', 'etsy'),
          option('Google Shopping', 'google_shopping'),
          option('Landing page', 'landing_page'),
          option('SaaS', 'saas'),
          option('Shopify', 'shopify'),
          option('TikTok Shop', 'tiktok_shop'),
          option('Walmart', 'walmart'),
          option('WooCommerce', 'woocommerce'),
        ],
      },
    }),
    brand_id: brandProp,
    tone: Property.ShortText({ displayName: 'Tone', required: false }),
    audience: Property.ShortText({ displayName: 'Audience', required: false }),
    language: Property.ShortText({ displayName: 'Language', required: false }),
    overview: Property.LongText({ displayName: 'Overview', required: false }),
    price: Property.Number({ displayName: 'Price', required: false }),
    keywords: Property.ShortText({ displayName: 'Keywords', required: false }),
  },
  async run({ auth, propsValue }) {
    return skryvoRequest(auth.secret_text, HttpMethod.POST, '/listings', given(propsValue));
  },
});
