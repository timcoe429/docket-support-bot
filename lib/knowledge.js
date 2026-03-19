/**
 * Internal reference docs for the support agent.
 * This is passed to Claude as context, not as instructions.
 * Claude uses it naturally like an employee would use a company wiki.
 */
export const KNOWLEDGE_BASE = `
DOCKET / SERVICECORE
Managed Websites Knowledgebase
Comprehensive Reference for Chatbot & Support Teams
Docket Customer Marketing Team
Last Updated: March 2026

1. Company Overview
1.1 What Is Docket?
Docket is a SaaS platform for field service businesses. It primarily serves roll-off dumpster rental companies, but also works with junk removal, portable sanitation, septic, grease trap, and commercial/residential waste companies. Docket is part of ServiceCore.
1.2 What Is the Docket Website Offering?
As part of their Docket software subscription, clients can receive a complimentary website built by the Docket Customer Marketing team. This is a done-for-you website build based on a pre-designed template library. It is not a custom website solution. The website is an optional benefit included with GROW and PRO software plans.
1.3 Software Plans That Include a Website
Plan
Website Included
Notes
GROW
Yes
Self-managed website included
PRO
Yes
Self-managed website included, plus local SEO features
START
No
No website included. If client downgrades from GROW/PRO to START, their website is deactivated.


1.4 Industries We Serve
Roll-off dumpster rental (primary)
Junk removal
Portable sanitation (porta potties)
Septic pumping
Grease trap services
Commercial and residential waste hauling


2. Hosting & Technical Infrastructure
2.1 How Websites Are Hosted
All client websites are hosted on Docket-managed WordPress multisite networks powered by WPMU DEV. There are currently 5 multisite installations (dockethosting2.com, dockethosting3.com, etc.), each hosting approximately 200 client websites. The total network manages 800+ live client websites.
2.2 What This Means for Clients
Clients do NOT have their own hosting. Their site lives on our shared multisite network.
Clients do NOT need a separate WordPress hosting plan. Hosting is included.
Clients cannot install plugins. This is a hard restriction to protect all 200+ sites on each network.
Clients do not have server access, FTP access, or cPanel access.
Clients have limited WordPress login access scoped to what they need for basic editing.
2.3 Technology Stack
Component
Details
CMS
WordPress Multisite
Page Builder
Elementor (drag and drop editing)
Theme Framework
Varies by template (Elementor-based templates)
Hosting Provider
WPMU DEV managed hosting
SEO Plugin
Rank Math SEO (pre-installed, free version only)
Contact Forms
Docket Forms (embedded iframe from forms.yourdocket.com) - NOT controlled in WordPress
Code Injection
Code Snippets plugin (used for chatbots, GA, Meta Pixel, tracking scripts, etc.)
Review Platform
Pastel (used for client website review during builds)


2.4 Plugin Policy
No new plugin installations are allowed on client websites. Period. This protects the entire multisite network. If a client has a specific need (e.g., a chatbot, tracking pixel, analytics), we handle it through Code Snippets or a backend request to the team. The Rank Math SEO plugin is pre-installed. Clients should NOT upgrade to the paid version of Rank Math, as it is not compatible with our network configuration.


3. Website Build Process
3.1 Pre-Build Checklist (What Clients Need Before Starting)
Website Domain: Docket does NOT provide domains. Clients need their own domain (we recommend GoDaddy). The URL their website will live at must be purchased and managed by the client.
Company Logo / Branding: A logo file and/or company brand colors. We use whatever logo is provided as-is. We do NOT have a graphic designer. We cannot customize, modify, recolor, or redesign logos.
Photos: Photos of dumpsters, completed jobs, staff, equipment. These personalize the template. Stock images are used if the client does not provide photos.
Company Email Address: Required for 10DLC compliance if they plan to text customers. Must be either a Gmail address or a branded email (e.g., support@yourdumpstercompany.com).
3.2 Template Selection
Clients choose from one of four pre-designed website templates during onboarding. Each template comes with a set structure. We do not combine templates, customize template structure, or build custom layouts. The template defines the page layout, section order, and overall design. We swap in the client's content and images into the existing template structure. That is the full scope.
3.3 Build Types
Fast Build
Ready for launch in approximately 3 days
Zero revisions before launch
Stock content only (client customizes it themselves after launch)
Best for clients who do not yet have a logo, images, or brand colors
Client is responsible for all customization post-launch
Standard Build
Ready for launch in approximately 21-30 days
One revision round before launch (72-hour review window)
Built with the client's content and images (plus stock content as needed)
Recommended option for most clients
3.4 Onboarding Form
Clients fill out an onboarding form on yourdocketonline.com with their business information, content, images, and preferences. This form submission automatically creates a Trello card for the build team. The build is created from whatever is submitted on this form. If a client submits two forms, we build from whichever was received first unless told otherwise. We cannot see external sites (like a GoDaddy site or Wix site) and we do not replicate or match existing builds from other platforms.
3.5 What Is Included in the Build
Included
NOT Included
Choose from 4 proven templates
Custom page layouts or designs
Swap in client text, images, business info into template
New pages beyond the template structure
One review cycle with edits/corrections (Standard Build)
New sections not in the selected template
Launch on standard timeline
Template structure modifications
Self-managed access post-launch
Graphic design services (logo editing, image creation)
DocketShop integration (if Online Booking is set up)
Changing layout or placement of existing sections
Domain pointing / DNS handled at launch
Plugin installations
Contact form (Docket Forms iframe)
Custom development or coding


To be clear: we take the template structure that exists, and we replace the placeholder text with the client's text, and the placeholder images with the client's images. We do not modify the template structure, create new layouts, or add new sections.
3.6 Standard Pages on a New Build
Home
About
Contact
Dumpsters (or relevant service page)
That's it. Additional pages like location pages, blog posts, FAQ pages, etc. are added by the client post-launch (self-managed) or by the team (WebsiteVIP).


4. Website Review Process (Standard Build Only)
4.1 How the Review Works
One 72-hour review window is provided for Standard Build websites.
Review link is sent approximately 11am EST on the scheduled review date.
Client reviews their website using Pastel (a visual annotation tool). They leave comments directly on the preview.
After the review window closes, the team works through edits. This takes approximately 1-2 business days.
A final approval email is sent before launch. Client can approve or flag anything not done correctly.
4.2 What the Team CAN Do During Review
Swap photos (client must attach the new photo)
Change text (client must provide exact new wording)
Update logos (client must provide the file)
Change colors and styles within the template framework
Add dumpster details and service information into existing sections
4.3 What the Team CANNOT Do During Review
Add new pages or sections outside the template
Install plugins or add features not in the template
Perform graphic design or image editing
Make changes without the required content or assets provided by the client
Restructure the template layout
4.4 Review Notes
Book Now buttons: Not clickable during review. They are linked at launch.
Social media icons: Blocked by the Pastel review platform. They are linked if provided on the submission form.
86-hour follow-up: If the client has not completed their review within 86 hours, a follow-up email populates in ChurnZero Command Center for manual approval.


5. Website Launch & DNS
5.1 What Happens at Launch
The Docket team handles domain pointing (DNS) when the site goes live. The client does not need to do this themselves. (As long as we were granted access)
If DocketShop / Online Booking is set up, the team connects it at launch. Book Now buttons link to DocketShop. 
If Online Booking is NOT set up at launch, Book Now buttons link to the Contact page instead.
Client login credentials are sent after launch via automated email from ChurnZero (approximately 5 minutes after the launch date is entered).
The website goes live on the client's domain.
5.2 DNS & Domain Ownership
Clients signed BEFORE May 2023
Docket may manage DNS for these legacy accounts. They should contact Docket Support for DNS changes.
Clients signed AFTER May 2023
The client manages their own DNS at their domain registrar (GoDaddy, Namecheap, DreamHost, etc.). To point their domain to the Docket website, they create an A record and/or CNAME record as instructed by the team. To find their registrar, they can use whois.com. DNS propagation takes up to 24-48 hours (usually much faster).
5.3 Domain Registrar Responsibilities
Docket does NOT provide domain names. The client is responsible for purchasing and renewing their domain through their registrar. If a client cancels hosting, they should keep their domain registration active so they don't lose their URL. The domain and the hosting are separate things.


6. Post-Launch: Self-Managed Websites
6.1 Core Principle
After launch, websites are SELF-MANAGED by the client. We build it, launch it, and hand it off. We do not perform ongoing edits for standard (non-VIP) clients. The client is fully responsible for maintaining and updating their website content after launch.
6.2 What Clients CAN Do Themselves
Edit text, images, and content using Elementor (drag and drop)
Add new pages
Add blog posts (H2 headings auto-populate Table of Contents)
Add new sections to existing pages
Add new users
Add FAQ sections using the Toggle widget
Add Google Reviews using the Testimonial Carousel widget
Duplicate pages
Configure Rank Math SEO for on-page optimization (titles, meta descriptions)
Add lead gen forms by creating them in Docket > Forms and embedding them
6.3 What Clients CANNOT Do
Install plugins (hard restriction - protects the multisite network)
Access the server, FTP, or cPanel
Upgrade Rank Math to the paid version (incompatible with our network)
Make changes that affect the multisite network at large
6.4 Help Resources
Website Help Page: https://dockethosting.com/websitehelp/ - Guides clients through most common edits and changes.
Website Review Help: https://dockethosting.com/website-review-help/ - Post-review next steps and FAQ.
Support Email: websites@yourdocket.com - Monitored during business hours. Responses within 24 hours during business hours.
6.5 Contact Form (Important Detail)
The contact form on Docket websites is controlled in the Docket software, NOT in WordPress. To edit the contact form, clients must log in to Docket > Forms > Contact (Web) Form > edit > Update Form. Changes populate automatically on the website. The form is embedded via an iframe from forms.yourdocket.com. There is a code comment in the page that says 'DO NOT DELETE THIS CODE! To edit the form, please use the docket software.'
6.6 Caching
Changes may not appear immediately after clicking Update in Elementor due to caching. The cache needs time to refresh. Clients should try clearing their browser cache and opening in a new incognito window. It may take a few hours for the cache to fully update for all visitors.
6.7 Google Indexing
After a new website launches, it takes time (weeks or longer) for Google to crawl and index it. The site will not appear in Google search results immediately. This is normal and expected behavior for all new websites.


7. WebsiteVIP (Premium Managed Plan)
7.1 Overview
WebsiteVIP is a premium add-on at $299/month where the Docket team fully manages the client's website. This is the Recommended option during onboarding for clients who want a white-glove service. It is still NOT a custom website solution. The same template rules apply. It is a 12-month contract.
7.2 What WebsiteVIP Includes
Completely managed by the Docket team (client does not need to make their own edits)
Unlimited edits (text, image, content swaps within the template structure)
AI Chatbot added to the website
On-Page SEO optimization using Rank Math (titles, meta descriptions, etc.)
5 Location Pages
12 Blog Posts (rolled out over ~12 weeks)
1 FAQ Page
Google Analytics setup
Hotjar Analytics setup (findings report sent at ~6 months)
Digital Audit (Google Business Profile audit at ~6 weeks)
25 Directory Listings
7.3 WebsiteVIP Timeline
Milestone
What Happens
Signup
Intro email sent. Client's WordPress access downgraded to Subscriber (intentional for version control). Client fills out WebsiteVIP Information Form.
Week 1
Google Analytics and Hotjar added to the site.
Week 2
FAQ page and 5 location pages published using client's form data.
Week 4
On-page SEO optimization completed (Rank Math).
Week 6
Digital Audit (Google Business Profile audit) completed and sent.
Week 12
All 12 blog posts published.
Week 24 (6 mo)
Hotjar findings report sent. Chatbot added.


7.4 WebsiteVIP Access Changes
When a client signs up for WebsiteVIP, their WordPress user access is downgraded to Subscriber. This removes their ability to edit the site directly. This is intentional for version control so the team can manage changes properly. The intro email explains this to the client.
7.5 What WebsiteVIP Does NOT Include
Custom designs or layouts beyond the template
New pages beyond the included location pages, blogs, and FAQ (exception: relevant service addition pages like Junk Removal)
Graphic design or image creation
Copywriting (client must still supply content and images for edits)
Custom development or coding
7.6 WebsiteVIP Cancellation
WebsiteVIP is a 12-month contract. If a client cancels early, they are still bound by the contract terms. When the VIP is canceled, the client's WordPress access is restored and they become responsible for managing their own site again. All content created during VIP (location pages, blogs, FAQ, etc.) remains on the site.


8. DocketShop (Online Booking Integration)
8.1 What DocketShop Is
DocketShop is Docket's built-in online shopping cart for dumpster rentals. It connects to the Online Booking feature within the Docket software and allows website visitors to book dumpsters directly from the website.
8.2 How It Works on Websites
If Online Booking is set up at launch: Book Now buttons on the website link directly to DocketShop.
If Online Booking is NOT set up at launch: Book Now buttons link to the Contact page instead.
DocketShop is added to the website via a backend script by the Docket team. This is not something clients install themselves.
8.3 Adding or Removing DocketShop
To add DocketShop after launch: Contact the Docket Support team or Docket Customer Marketing. The team adds the DocketShop script to the website backend.
To remove DocketShop: Submit a request through the same channels.
8.4 Changing Book Now Button Text (Critical)
If a client changes any 'Book Now' button text on their website AND they have DocketShop enabled, they MUST add the new button text as a token in Docket: Online Booking > Developer/Website Scripts > Website Elements > Webpage Phrases. Then they need to notify the team to update the DocketShop script. If this step is missed, the new button will not trigger the DocketShop shopping cart.
8.5 DocketShop Analytics
DocketShop analytics requires the Premium Plan in Docket. Analytics can be viewed in Docket > Online Booking > Insights/Sessions, or through Google Analytics if a GA Measurement ID is added in Docket > Online Booking > Developer/Website Scripts.


9. Directory Listings
9.1 What They Are
Directory listings are business citations on popular websites (Google Business Profile, Yelp, BBB, Yellow Pages, etc.) that display the client's business name, address, and phone number (NAP). Docket provides 25 directory listing submissions as part of certain plans.
9.2 Who Gets Directory Listings
WebsiteVIP clients: 25 directory listings included
PRO plan clients: May receive directory listings as part of local SEO features
9.3 What Directory Listings Do and Don't Do
Directory listings help establish local online presence, help customers find contact details on popular websites, signal to Google that the business exists, and improve general local visibility. Directory listings do NOT rank a business for specific keywords, do NOT replace the need for SEO, and do NOT guarantee first-page Google results. They are foundational citations that work alongside SEO, not a substitute for it.
9.4 Cost and Providers
Originally sourced through BrightLocal at $50 per 25 citations. Currently sourced through a more cost-effective provider at $15 per 25 citations, resulting in significant monthly savings.


10. Scripts, Analytics & SEO
10.1 Adding Tracking Scripts (GA, GTM, Meta Pixel, etc.)
Clients cannot install plugins. To add tracking scripts, chatbots, Google Analytics, Meta Pixel, or other code to their site, clients should use the Code Snippets plugin (if they have access) or submit a request via the help page form at dockethosting.com/websitehelp/. The team will add scripts that cannot be handled through Code Snippets.
Important: When using Code Snippets, make sure the snippet type is set to HTML, not PHP. Setting it to PHP when adding JavaScript will cause errors.
10.2 Google Analytics
GA is not automatically added to standard (self-managed) websites. For WebsiteVIP clients, GA is added in Week 1. For self-managed clients who want GA, they should submit a request through the help page with their GA tracking code/script.
10.3 Google Search Console
Clients set up Search Console in their own Google account. When Search Console asks for a site verification meta tag, clients should submit that tag to the team via the help page form, and the team will add it to the site.
10.4 Rank Math SEO
Rank Math is pre-installed on all websites. Clients can access it via Dashboard > Rank Math SEO > Setup Wizard (use Easy Mode). For per-page SEO: Dashboard > Pages > Edit > Rank Math SEO section > Edit Snippet. Important: Do NOT upgrade to the paid version of Rank Math. The paid version is not compatible with our multisite network.
10.5 10DLC Compliance
Docket websites meet 10DLC standards, making it easy and compliant for clients to text their customers via Docket. This requires the client to have either a Gmail address or a branded email address.


11. Cancellation & Deactivation
11.1 When a Client Cancels Their Docket Subscription
If a client cancels their Docket software subscription or downgrades to the START plan, their website will be deactivated and will no longer be live. The client does not get to keep the website. Once deactivated, their domain will no longer point to a live site.
11.2 Before Canceling
Clients should be asked if they have a new website ready to replace the Docket site. If they cancel without a replacement, their business will have no web presence. They should also be reminded to keep their domain registration active at their registrar even after canceling Docket hosting.
11.3 Website Deactivation Requests
To deactivate a Docket website: Submit a request via the form at dockethosting.com/websitehelp/. Cancellation requests are submitted to the finance team for processing.
11.4 Transferring Away from Docket
Clients cannot export or download their Docket website files. If they want to move to a different platform, they need to build a new website on that platform and point their domain to the new site. They should have their new site ready before canceling.
11.5 Domain Pointing After Cancellation
To point their domain away from Docket to a new website: Update the A record and CNAME at their domain registrar. DNS propagation takes up to 24-48 hours. The client's best option is to contact their registrar support (GoDaddy, Namecheap, etc.) and let them know they are moving to a new site. The registrar can help them update the right records.


12. Most Common Support Questions (Ranked by Frequency)
Based on analysis of the internal Website Support Slack channel, these are the most frequently asked questions and issues. This section is designed to help the chatbot handle the most common scenarios.
12.1 DocketShop Integration Requests (~45+ instances)
The single most common request. Internal teams and clients asking to have DocketShop linked or enabled on a website.
Standard response: DocketShop is added by the Docket Customer Marketing team via a backend script. Submit a request through the internal support channel or have the client contact websites@yourdocket.com.
12.2 Website Login / Access Issues (~25+ instances)
Clients forgetting credentials, locked out of WordPress, or having password reset problems.
Default username format: First initial + last name + 123 (e.g., jsmith123).
Password reset: Can be reset by the client at the WordPress login screen, or the team can send new credentials.
WebsiteVIP clients: Their access was intentionally downgraded to Subscriber. This is by design for version control.
12.3 Website Down / Not Loading (~20+ instances)
Sites completely offline, showing errors (403 Forbidden, 'Dumpster Rental Sites - Error'), or displaying incorrectly. These are typically escalated to the hosting/dev team for investigation. Common causes include DNS issues, server-side errors, or caching problems.
12.4 Domain Connection / DNS Issues (~18+ instances)
Questions about connecting domains, transferring domains, or updating DNS records.
Key facts: We handle DNS at launch. Post-launch, the client manages their own DNS at their registrar. We do NOT manage client email (MX records) or other DNS records beyond the website.
12.5 Website Edit Requests (~15+ instances)
Clients asking us to make edits. For self-managed sites: the client makes their own edits via Elementor. Direct them to the help page at dockethosting.com/websitehelp/. For WebsiteVIP clients: submit the edit request to the team.
12.6 Review Window / Build Status Questions (~12+ instances)
Clients asking about their review link, when their site will be ready, or the status of their build.
Standard Build: 21-30 days to build, then 72-hour review window, then 1-2 business days for edits, then final approval before launch.
Fast Build: 3 days, no review. Client customizes after launch.
12.7 SEO / Local SEO Inquiries (~12+ instances)
Clients asking about SEO included with their plan, directory listings status, or how to rank higher.
Self-managed sites: Basic Rank Math SEO is pre-installed. No active SEO management is provided.
PRO plan: May include local SEO features like directory listings.
WebsiteVIP: Includes on-page SEO, blog posts, location pages, directory listings.
For advanced SEO: This is a separate paid engagement beyond the website subscription.
12.8 Script / Code Integration Requests (~10+ instances)
Requests to add Google Tag Manager, GA tracking codes, chatbot scripts, SurvCart embeds, or tracking pixels. These are handled through Code Snippets or backend team requests.
12.9 Fast Build vs Standard Build Questions (~8+ instances)
Confusion about build types. Fast Build = stock content, no review, 3 days. Standard Build = client content, one review, 21-30 days. Clients can launch with stock images and replace them later.
12.10 Plugin / Feature Questions (~8+ instances)
Clients wanting to add plugins, upgrade Rank Math, or install features. Answer: No plugin installations allowed. Period. This protects the multisite network. If they have a specific need, submit a request and the team will evaluate alternatives.
12.11 Client Downgrade / Cancellation (~7+ instances)
When a client downgrades from GROW or PRO to START, their website is deactivated. If they cancel entirely, the website goes offline. The client does not retain the website.
12.12 Domain Transfer / Website Migration (~6+ instances)
Clients wanting to move their domain or website away from Docket. They cannot export the website files. They need to build a new site elsewhere and point their domain to it. Suggest they work with their registrar to update DNS records.


13. Internal Systems & Tooling (Reference)
13.1 Trello
Used for tracking website builds through the pipeline. Cards auto-create from onboarding form submissions. The board has lists for each stage: Dreamcoders Team (new submissions), QA, Ready for Review Scheduling, Waiting on Review Scheduling, Client Reviewing, Edits to Complete, Edits Completed, Final Approval, and Launched.

WEBSITE BUILD TIMELINE & WHAT CLIENTS SHOULD EXPECT

Standard Build (most common):
- Client submits onboarding form → build begins
- Build + QA takes approximately 2-3 weeks
- Client receives a "Schedule Your Website Review" email when the draft is ready
- Client schedules their review date
- On the review date, client receives a link to review their website via Pastel (visual review tool)
- 72-hour review window — client leaves feedback directly on the preview
- Team completes edits within 1-2 business days after review
- Client receives an "edits complete" email with a link to check the changes
- Once client approves AND domain access is received, the site is queued for launch
- Sites go live on Tuesdays and Thursdays
- After launch, client receives login credentials via email (within about 5 minutes of launch)

Fast Build:
- Client submits onboarding form → build begins
- Site is built with stock content in approximately 3 days
- No client review step — site goes live as-built
- Client customizes the site themselves after launch
- Best for clients who don't have a logo, images, or brand content yet

WebsiteVIP ($299/month, 12-month contract):
- Fully managed by the team — client does NOT make their own edits
- WordPress access is intentionally downgraded to Subscriber (version control)
- Includes: unlimited edits, 5 location pages, 12 blog posts, FAQ page, on-page SEO, Google Analytics, Hotjar analytics, digital audit, AI chatbot (at 6 months), 25 directory listings
- Does NOT include: custom designs, new pages beyond what's listed, graphic design, copywriting, custom code
- If a client wants ongoing management instead of self-managed, this is the option

After launch (standard self-managed sites):
- Client is fully responsible for maintaining and updating their website
- Direct them to https://dockethosting.com/websitehelp/ for editing guides
- If they want managed service, that's WebsiteVIP

DocketShop (Online Booking):
- Added by the team via backend script — clients don't install it themselves
- If Online Booking is set up at launch, Book Now buttons link to DocketShop
- If not set up, Book Now buttons link to the Contact page instead
- IMPORTANT: If a client changes Book Now button text and has DocketShop, they must add the new text as a token in Docket > Online Booking > Developer/Website Scripts > Website Elements > Webpage Phrases, then notify the team

Contact Form:
- The contact form is controlled in Docket software, NOT in WordPress
- To edit: Docket > Forms > Contact (Web) Form > edit > Update Form
- Changes populate automatically on the website
- There is a code comment in the page saying "DO NOT DELETE THIS CODE"

Cancellation:
- If a client cancels Docket or downgrades to START plan, their website is deactivated
- They cannot export or download their website files
- They should have a new website ready before canceling
- They should keep their domain registration active at their registrar

13.2 ChurnZero
Used for automated email workflows, client account management, and task scheduling. Key fields tracked: Build Type, Start Date, Application Submission Status, Website Review Link, Launch Date, Shop Added. Command Center is where automated emails are approved and sent.
13.3 Pastel
Visual annotation tool used for website reviews. Clients leave comments directly on a preview of their site. The team works through these annotations to make edits. Known issue: Clients sometimes reply via email instead of clicking 'I'm Done' in Pastel, which means the Trello card may not auto-advance.
13.4 Salesforce
Sends notifications when new WebsiteVIP customers sign on. Used to confirm contacts and identify the account executive who sold the plan.
13.5 Support Email
websites@yourdocket.com - The primary external-facing support channel for website-related inquiries. Monitored during business hours. Responses within 24 hours during business hours.
Docket Support team: 1-888-828-1168 or support@yourdocket.com - For DocketShop-specific questions and general Docket software support. The website team's scope is specific to websites; DocketShop product questions should go to the Support team.


14. Key Communication Principles
14.1 Know Your Audience
Docket clients are primarily small business owners in the waste management industry. Most are NOT tech-savvy. Keep all communication simple, clear, and jargon-free. Do not over-explain technical concepts. Do not assume they know what DNS, A records, CNAME, hosting, or caching mean. If they ask a simple question, give a simple answer.
14.2 Template Rules Are Non-Negotiable
The website is built from a template. We swap content and images. That's it. No custom layouts, no structural changes, no combining templates, no matching external sites. This is a high-volume operation managing 800+ sites. The templates are optimized based on real conversion data across hundreds of dumpster rental websites.
14.3 Self-Managed Means Self-Managed
After launch, standard clients are responsible for their own site. We built it, launched it, and handed it off. Direct them to the help page. If they want ongoing management, that's WebsiteVIP at $299/month.
14.4 Scope Boundaries
The website team's scope is websites. DocketShop product questions, software billing issues, and Docket software feature questions should be directed to the Docket Support team at 1-888-828-1168 or support@yourdocket.com.
14.5 We Handle DNS at Launch
When we push a site live, we handle the domain pointing. Clients do not need to do this. Post-launch, the client manages their own registrar for any future DNS changes. We do not manage their email, MX records, or other DNS records.

QUICK ACTION LINKS (share these when relevant)
- Schedule a website review: https://yourdocketonline.com/schedule-review/
- Start a website build (onboarding): https://yourdocketonline.com/onboarding-flow/
- Grant domain access: https://yourdocketonline.com/domain-access/
- Submit directory listings for Local SEO: https://dockethosting.com/local-seo-information/
- Website help page: https://dockethosting.com/websitehelp/
- Website review help: https://dockethosting.com/website-review-help/
- Support email: websites@yourdocket.com
- Docket Software Support: 1-888-828-1168 or support@yourdocket.com (for DocketShop and software questions — NOT website questions)
`;
