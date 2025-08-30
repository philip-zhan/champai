Champ AI builds agents that resolve customer support tickets by integrating with platforms like Zendesk, Intercom, and Salesforce.

**What you’ll do**
Create a small app from scratch in any language/framework you prefer. You’re welcome to use AI coding tools.

**Timebox**
The assignment has two parts, ~30-45 minutes each (about one hour - 1.5 hours total). Please try to stick to this guidance. This is designed to be short on time, so you will need to make some trade-offs.

Our recommendation is to read through this assignment completely, spend some time thinking about which path you’d like to take, do some non-coding research as necessary, then complete coding in one sitting. 

**How to work**
Treat this like a production task: make regular git commits so we can see your approach and timing.

**What to submit**
Share a link to the git repo. You will demo on your computer, so don’t worry about setup instructions.

**What happens next**
We’ll schedule a brief follow-up for you to demo the app and discuss your design decisions.

---

**Part 1 - Zendesk Ticket Import - 30-45 mins**

Build a one-click **“Sync from Zendesk”** that pulls tickets into your local datastore and keeps them up to date for the demo.

**What we provide**

- Our Zendesk **subdomain** (`d3v-champ9881`) and **API token**.
- A Zendesk instance where you can create tickets or reply during your development and demo - [support@d3v-champ9881.zendesk.com](mailto:support@d3v-champ9881.zendesk.com).

**Must-haves**

- **Comments:** For each ticket, make sure all the messages (comments) are imported as well. These are needed for Part 2.
- **Import window:** Fetch **all tickets updated in the last 30 days** on the first run.
- **Ongoing updates:** Handle **newly created or updated tickets** after your initial import.
- **Consistency:** After a sync, your datastore should **match Zendesk**.
- **Pagination + rate-limit handling:** Don’t stop at the first page; handle throttling gracefully.
- **Idempotent sync:** Safe to run multiple times without duplicating or corrupting data.

**How we’ll test in your demo**

1. Start with empty DB tables.
2. You’ll run your import to begin sync.
3. We’ll make a few changes in Zendesk (e.g., create a ticket, change status/tags/assignee).
4. We’ll take a look at the data to see if the changes are reflected (a simple table/JSON view is fine).

---

**Part 2 - Choose ONE - 30-45 mins**

Pick the path you’re most interested in. Complete **only one**.

**Part 2a - Response Agent** 

Create an agent that responds to tickets and posts the reply back to Zendesk. **Only respond** if the latest message is from **your email** or from **@champ.ai**.

We will provide you with an OpenAI API key. In your demo, we’ll create new tickets in Zendesk and converse with the agent.

You may include the KB articles provided (and any additional context) to ground responses. Avoid hallucinations - some questions may not be answerable from the provided articles.

**Focus areas:** Prompt/Context Engineering, Backend

---

**Part 2b - Ticketing Index**

Build a lightweight admin dashboard to **browse tickets** imported in Part 1. The users will be admins, so either us or our customers. Primarily used to see what actions were taken by Champ AI on the tickets.

Consider what’s most useful for customers look through many tickets: which filters/search/sort to include, how to present information, and how to reflect new updates.

In your demo, show the list page on your computer.

**Focus areas:** Frontend, Product UI/UX

---

**Part 2c - Chat Client**

Create a embeddable chat client we can use instead of the Zendesk chatbot. You can treat all your tickets from Part 1 as chat conversations, and render them as chat threads. If you’d like, you can post the replies from chat to Zendesk, however that is not required.

Consider what are the important features for a embedded chat client. How to handle multiple threads, pull new updates etc.

For reference, ZD chat client looks like this: https://app.champ.ai/demo/zendesk-chat. Please do not copy, but you may take inspiration.

**Focus areas:** Frontend, Product UI/UX
