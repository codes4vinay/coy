const prompts: Record<string, string> = {
  Coffee: 'What’s the little café you’d happily spend an entire afternoon in?',
  Photography: 'What’s a photo you’ve taken that has a story behind it?',
  Books: 'Which book would you love to read again for the first time?',
  Music: 'What song would be the first track on your ideal weekend playlist?',
  Travel: 'Where would you go for a spontaneous weekend away?',
  Cooking: 'What’s the dish you’d make to turn an ordinary evening into a good one?',
  Hiking: 'What’s a trail or a view you think everyone should experience once?',
};
export function buildConversationStarter(yourInterests: string[], theirInterests: string[]) {
  // A missing overlap gets a neutral prompt rather than an invented shared interest.
  const interest = theirInterests.find((value) => yourInterests.includes(value)) ?? null;
  return {
    interest,
    text: interest
      ? (prompts[interest] ??
        `What first got you into ${interest.toLowerCase()}, and what do you love most about it?`)
      : 'What’s one little thing that made you smile this week?',
  };
}
