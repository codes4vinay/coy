import { z } from 'zod';
export const swipeBody = z
  .object({ profileId: z.string().regex(/^[a-fA-F0-9]{24}$/), direction: z.enum(['like', 'pass']) })
  .strict();
export type SwipeInput = z.infer<typeof swipeBody>;
