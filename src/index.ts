import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { designPicture } from './lib/actions/design-picture';
import { getArticle, planArticle, publishArticle, writeArticle } from './lib/actions/articles';
import { schedulePost } from './lib/actions/schedule-post';
import { writeEmail, writeListing } from './lib/actions/writing';
import { writePost } from './lib/actions/write-post';
import { BASE_URL, skryvoAuth } from './lib/common';
import { newEvent } from './lib/triggers/new-event';

export const skryvo = createPiece({
  displayName: 'Skryvo',
  description:
    "Write posts, articles, emails and listings in a brand's voice, design their pictures, and schedule them once approved.",
  auth: skryvoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://skryvo.ai/icons/Icon-512.png',
  authors: ['skryvo'],
  categories: [PieceCategory.MARKETING, PieceCategory.CONTENT_AND_FILES],
  actions: [
    writePost,
    designPicture,
    schedulePost,
    planArticle,
    writeArticle,
    getArticle,
    publishArticle,
    writeEmail,
    writeListing,
    createCustomApiCallAction({
      auth: skryvoAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => ({ Authorization: `Bearer ${auth.secret_text}` }),
    }),
  ],
  triggers: [newEvent],
});
