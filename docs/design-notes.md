# Product and design notes

This standalone implementation follows the assignment brief. Authenticated product signup, OTP verification, purchases, and email outreach were not performed; the design research uses Coy's public materials.

## Coy references

Reviewed the public HTML and CSS of https://getcoy.com/, https://getcoy.com/blog/how-coy-works, and https://getcoy.com/privacy. The browser search fetch failed, but direct HTTPS retrieval succeeded. The source links above document the reference material; redundant HTML and CSS snapshots are omitted. We did not explore authenticated app screens and do not claim to have done so.

The actual marketing tokens include `#FF3D81` pink, `#D81E63` strong pink, `#F6F4FA` soft background, `#E7E0FF` lilac, `#15121D` text, and Bricolage Grotesque. Discover uses these exact tokens, the public Coy wordmark, pill navigation, and Coy's dark outlined/shadowed primary button treatment. The narrower card and quieter borders adapt the public marketing design to a repeated daily interaction. Public assets are used solely for this brand-referenced hiring demonstration; no affiliation is implied. Review reuse rights before broader distribution. Bricolage Grotesque is distributed under the SIL Open Font License; a copy accompanies the font.

Desktop composition puts one portrait card between a small editorial introduction and the privacy promise. Small screens prioritize the card and actions, with a compact privacy note underneath. Both navigation levels remain available at 320px. The Home view is deliberately a minimal placeholder.

Photos are locally cached Unsplash stock portraits, reused across fictional adult demo identities. They are illustrative, do not identify the people in the photos, and do not depict actual Coy users. No image tracking request is needed during discovery. Sources: `https://images.unsplash.com/<photo-id>` with IDs in `assets.md`.

## Two feature proposals (Part A reference)

These are hypotheses based on the public product description, not claims about an authenticated product walkthrough.

1. **Private discovery opt-in and visibility controls.** Let a member explicitly join discovery and choose a broad campus/city audience, with an easy pause control. Coy currently describes knowing a crush's phone or email. An opt-in introduction surface expands possible connections while keeping the member in control. Audience settings should avoid tiny groups and precise location to reduce identity inference.
2. **Mutual-match conversation prompts.** After a confirmed match, offer optional shared-interest prompts that the pair can use when talking through their existing channels. Coy's public explanation says it has no chat. Prompts make the transition from uncertainty to conversation easier without building a messaging system or revealing anything before mutual consent.

Neither proposal introduces incoming-like lists, popularity counts, speculative hints, or paid identity reveals.
