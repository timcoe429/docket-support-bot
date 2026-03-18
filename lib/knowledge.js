/**
 * Internal reference docs for the support agent.
 * This is passed to Claude as context, not as instructions.
 * Claude uses it naturally like an employee would use a company wiki.
 */
export const KNOWLEDGE_BASE = `
ABOUT DOCKET
Docket is a dumpster rental software company. Our clients are small business owners — mostly roll-off dumpster rental companies. They're busy, not always tech-savvy, and want quick answers.

We build WordPress websites for our clients using Elementor page builder. Most sites follow similar templates and structures.

SUPPORT TEAM INFO
- Team name: Docket Websites team
- Support email: websites@yourdocket.com
- Support hours: Monday–Friday, 8am–5pm EST
- All support is via email or chat. We do not do phone calls.

USEFUL LINKS
- Schedule a website review: https://yourdocketonline.com/schedule-review/
- Start a website build (onboarding): https://yourdocketonline.com/onboarding-flow/
- Grant domain access: https://yourdocketonline.com/domain-access/
- Submit directory listings for Local SEO: https://dockethosting.com/local-seo-information/

WEBSITE BUILD STAGES
These are the stages a website goes through on our Trello board. Clients don't see these internal names — translate to plain English.
- Dreamcoders Team = Site is being built by our dev team
- QA = We're doing final quality checks before sending for review
- Draft Completed = The design draft is finished
- New Builds Ready to Send = Draft is ready to send to the client for review
- Client Reviewing = We've sent it to the client, waiting on their feedback
- Edits to Complete = Client gave feedback, we're making the requested changes
- Pre Launch = Final prep before going live
- Ready for Launch = Everything is set, launching soon

DOMAIN ACCESS
We need admin/delegate access to the client's domain — we NEVER ask for passwords or login credentials.
The client fills out our domain access form: https://yourdocketonline.com/domain-access/
The form asks which registrar they use, and then walks them through exactly how to grant us access based on their registrar (GoDaddy, Namecheap, etc.)
We do NOT send delegate access emails ourselves — the form handles the instructions.
If a client doesn't know their registrar, suggest they check where they bought their domain name or look at billing emails for it.

WHAT CLIENTS CAN DO THEMSELVES
These are all doable in Elementor by the client. Walk them through it when they ask:
- Edit text on any page
- Replace images
- Update phone numbers, addresses, hours of operation
- Change service areas
- Add blog posts
- Add new pages using Elementor templates
- Basic widget editing (text, images, buttons, maps)
- Update their navigation menu

WHAT REQUIRES OUR TEAM
These need someone from our team to handle. Offer to have the team follow up:
- Plugin installations or updates
- Theme changes or updates
- DNS / domain configuration
- Custom code or PHP changes
- SEO configuration beyond basics
- Server or hosting issues
- Anything in wp-admin outside the Elementor editor

ESCALATION
If a client asks to speak with a person, or the issue genuinely requires our team to handle, the system automatically notifies the team via Slack. The client should hear something like "I've let our Docket Websites team know — someone will follow up with you via email" and mention business hours (M-F 8am-5pm EST) if relevant.

ELEMENTOR / WORDPRESS
Most client websites use Elementor page builder on WordPress. When clients need editing help, use web search to find current Elementor documentation from elementor.com/help. Give specific step-by-step guidance based on what they're trying to do.

Common client questions:
- "How do I change text?" → Edit with Elementor, click the text widget, type
- "How do I change an image?" → Click the image widget, click Choose Image, upload new one
- "How do I add a page?" → WordPress admin → Pages → Add New → Edit with Elementor
- "How do I update my menu?" → Appearance → Menus in WordPress
- "Where do I log in?" → yourdomain.com/wp-admin
- "I forgot my password" → Use the "Lost your password?" link on the login page
`;
