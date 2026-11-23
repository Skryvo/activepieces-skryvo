import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blogProp, brandProp, given, skryvoAuth, skryvoRequest } from '../common';

const articleId = Property.ShortText({
  displayName: 'Article ID',
  description: 'The article_id from Write an Article, or a generation_id.',
  required: true,
});

export const planArticle = createAction({
  auth: skryvoAuth,
  name: 'plan_article',
  displayName: 'Plan an Article',
  description: 'Plans an article for free: headline, outline, search phrase and the questions only the person can answer.',
  props: {
    topic: Property.ShortText({ displayName: 'Topic', description: 'What the article is about, 3 to 200 characters.', required: true }),
    brand_id: brandProp,
    only_you: Property.LongText({
      displayName: 'Only You Know',
      description: 'Facts only the person knows, used in their words.',
      required: false,
    }),
    sources: Property.Array({ displayName: 'Sources', description: 'Up to three public pages to read.', required: false }),
    keywords: Property.Array({ displayName: 'Keywords', required: false }),
    length: Property.Number({ displayName: 'Length', description: 'Words, 100 to 4000.', required: false }),
    tone: Property.ShortText({ displayName: 'Tone', required: false }),
    style: Property.ShortText({
      displayName: 'Style',
      description: 'For example how-to, listicle, comparison, case study or explainer.',
      required: false,
    }),
    language: Property.ShortText({ displayName: 'Language', required: false }),
    audience: Property.ShortText({ displayName: 'Audience', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
  },
  async run({ auth, propsValue }) {
    return skryvoRequest(auth.secret_text, HttpMethod.POST, '/articles/plan', given(propsValue));
  },
});

export const writeArticle = createAction({
  auth: skryvoAuth,
  name: 'write_article',
  displayName: 'Write an Article',
  description: 'Starts writing a planned article (two generations). The New Event trigger with Article ready, or Get an Article, picks up the result.',
  props: {
    plan_id: Property.ShortText({ displayName: 'Plan ID', description: 'From Plan an Article.', required: true }),
    answers: Property.Array({
      displayName: 'Answers',
      description: "The person's answers to the plan's questions, up to three.",
      required: false,
      properties: {
        question: Property.ShortText({ displayName: 'Question', required: true }),
        answer: Property.LongText({ displayName: 'Answer', required: true }),
      },
    }),
    headline: Property.ShortText({ displayName: 'Headline', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    pictures: Property.Checkbox({ displayName: 'Cover Picture', required: false }),
    inside_pictures: Property.Number({ displayName: 'Inside Pictures', description: '0 to 3.', required: false }),
  },
  async run({ auth, propsValue }) {
    return skryvoRequest(auth.secret_text, HttpMethod.POST, '/articles', given(propsValue));
  },
});

export const getArticle = createAction({
  auth: skryvoAuth,
  name: 'get_article',
  displayName: 'Get an Article',
  description: "Returns an article's status: writing with its stage, done with its text and checked claims, or failed.",
  props: { article_id: articleId },
  async run({ auth, propsValue }) {
    return skryvoRequest(auth.secret_text, HttpMethod.GET, `/articles/${encodeURIComponent(propsValue.article_id)}`);
  },
});

export const publishArticle = createAction({
  auth: skryvoAuth,
  name: 'publish_article',
  displayName: 'Publish an Article',
  description: 'Schedules a finished article to a connected blog, or sends it there now as a draft to review.',
  props: {
    article_id: articleId,
    channel_id: blogProp,
    as_draft: Property.Checkbox({
      displayName: 'Send as Draft',
      description: 'Sends it to the blog now as a draft to review there.',
      required: false,
      defaultValue: true,
    }),
    at: Property.DateTime({ displayName: 'Publish At', description: 'When not sent as a draft.', required: false }),
    original_url: Property.ShortText({
      displayName: 'Original URL',
      description: "The article's first home, credited by every copy.",
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { article_id, ...rest } = propsValue;
    const { post } = await skryvoRequest<{ post: unknown }>(
      auth.secret_text,
      HttpMethod.POST,
      `/articles/${encodeURIComponent(article_id)}/publish`,
      { ...given(rest), as_draft: rest.as_draft ?? true },
    );
    return post;
  },
});
