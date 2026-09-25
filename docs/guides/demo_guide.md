# Gabayan demo guide

A script for presenting Gabayan end to end: the accounts you need, how to prepare, what to click
in each scene, what to point out, and how to recover when something looks different. Every step,
label and number below comes from the app's browser journeys or was checked against a freshly
seeded backend on 2026-09-25.

To install and run Gabayan first, follow the [setup guide](setup_guide.md).

## Contents

- [The story in one minute](#the-story-in-one-minute)
- [Demo accounts](#demo-accounts)
- [Choose the backend](#choose-the-backend)
- [Prepare](#prepare)
- [The script](#the-script)
- [Suggested run orders](#suggested-run-orders)
- [Operator commands](#operator-commands)
- [Reset between runs](#reset-between-runs)
- [Talking points and likely questions](#talking-points-and-likely-questions)
- [If something looks different](#if-something-looks-different)

## The story in one minute

Two farmers carry the demo:

- **Maria Santos** is new. She signs up, is guided through planning her first tilapia pond,
  learns her plan is above the recommended stocking range, gets the equipment she needs with a
  **Buy now** button and an installation guide, and finds out what the Free plan covers.
- **Juan Dela Cruz** is six weeks into a tilapia cultivation. His day starts on Home with today's
  tasks; he records a feeding, growth, a mortality and a water observation, checks his water
  readings, follows his reminders, harvests a second pond, buys an aerator and tracks his order.

An **operator** at a terminal plays the back office: approving a plan upgrade and moving an order
toward delivery, since billing and courier integrations do not exist yet.

## Demo accounts

| Account                               | Email / mobile                           | Password       | Plan           | Where it comes from                                               | Used in                        |
| ------------------------------------- | ---------------------------------------- | -------------- | -------------- | ----------------------------------------------------------------- | ------------------------------ |
| **Juan Dela Cruz** - returning farmer | `juan@example.com` / `+639171234567`     | `Gabayan123!`  | Pro            | Seeded: `seed-demo` (FastAPI) or `pnpm mock:reset` (mock)         | Scenes 4-11                    |
| **Maria Santos** - new farmer         | `maria.demo@example.com` / `09171234568` | `SafeDemo123!` | Free, then Pro | Created live in scene 1                                           | Scenes 1-3 and 12              |
| **Backup new farmer** (optional)      | `ana.demo@example.com` / `09171234571`   | `SafeDemo123!` | Free           | Created during preparation, setup skipped                         | Stands in if typing live fails |
| **Operator** - back office            | no app sign-in                           | -              | -              | A terminal in `aqua-lens-api` with the virtual environment active | Scenes 3 and 10                |

Notes on the accounts:

- **Juan** has two cultivations: **Tilapia Batch #001** (growing, 500 stocked, 485 estimated live
  fish) and **Tilapia Harvest Demo** (pre-harvest, latest sample 360 g). His farm is **Dela Cruz
  Family Fish Farm** in San Pablo City, Laguna, and he has order **GBY-10245** (shipped, cash on
  delivery). You can sign in with his email or his mobile number.
- **Email addresses must be unique.** An account created in one run still exists in the next, so
  either [reset](#reset-between-runs) before each run or add a number for rehearsals
  (`maria.demo2@example.com`). Mobile numbers may repeat.
- **Passwords** need 8 to 128 characters; the sign-up form also asks you to confirm the password
  and accept the terms.
- **Mock only:** "Continue with Google (demo)" on the sign-in screen signs in as Juan, and
  `/reset-password?token=demo-reset-token` resets Juan's password. FastAPI refuses both, so do not
  use them in a FastAPI demo.
- **The sign-in screen shows Juan's credentials** under the form, which helps when presenting.

## Choose the backend

|                                  | FastAPI + PostgreSQL (setup B or C)                                  | Mock API (setup A)                                           |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| Recommended for                  | **Live demos**                                                       | Quick walkthroughs and UI rehearsals                         |
| Juan's data is laid out around   | The day you run `seed-demo`                                          | 2026-09-23, always                                           |
| Home on the demo day             | Juan's seeded tasks for today, plus the reminders that fall due      | Only the feeding tasks the mock raises for the real date     |
| Harvest readiness                | Uses samples up to 14 days old - seed on the demo day                | Always shows the seeded sample                               |
| Plan upgrade approval (scene 3)  | `python -m app.cli set-tier ...`                                     | Not available; show the pending request, then switch to Juan |
| Moving an order along (scene 10) | `python -m app.cli advance-order ...`                                | Not available; show GBY-10245 as shipped                     |
| Weather alerts (scene 12)        | Real forecast, or the fixed forecast with `WEATHER_PROVIDER=fixture` | Fixed forecast                                               |

Use **FastAPI**, seeded on the morning of the demo. The rest of this guide assumes it and notes
where the mock differs.

## Prepare

### The day before

- [ ] Both repositories are up to date and set up as in the [setup guide](setup_guide.md).
- [ ] Rehearse the run order you will use at least once, from a clean reset.
- [ ] Decide the weather scene: for a guaranteed alert, run the API with
      `WEATHER_PROVIDER=fixture` (see [scene 12](#scene-12---weather-alerts)).
- [ ] If presenting online, open the deployed site on the phone you will use and install it.

### 30 minutes before

- [ ] Reset and seed from scratch (FastAPI), in `aqua-lens-api`:

  ```powershell
  docker compose down -v
  docker compose up -d
  python -m alembic upgrade head
  python -m app.cli seed-demo
  $env:WEATHER_PROVIDER = 'fixture'     # only for the guaranteed weather alert
  uvicorn app.main:app --reload
  ```

  For an online demo site, seed from your machine against the hosted database instead
  ([setup guide 7.4](setup_guide.md#74-step-3---the-demo-account-demo-sites-only)), and open
  `/api/v1/health` so a sleeping free-tier host wakes up.

- [ ] Start the app: in `gabayan_pwa`, `pnpm dev --host 127.0.0.1`, and open
      **http://127.0.0.1:5173** (with the mock: `pnpm mock:reset`, `pnpm dev:all`,
      http://localhost:5173).
- [ ] Optional backup account: create `ana.demo@example.com`, choose **Continue with Free**, then
      **Set up later**, and sign out.

### 5 minutes before

- [ ] Browser: a fresh window (or clear the site data), zoom 100 %, and the device toolbar on
      at **390 × 844** (`F12`, then `Ctrl+Shift+M`). A real phone is even better.
- [ ] Keep a second terminal open in `aqua-lens-api` with the virtual environment active for the
      operator commands.
- [ ] Close notifications and chat apps on the presenting screen.
- [ ] Have this guide and the [accounts](#demo-accounts) at hand.

## The script

Each scene lists the account, the steps with the exact on-screen labels, and what to point out.
Times are for a steady pace with narration.

### Scene 1 - Welcome and sign-up

**Account:** Maria (new) · **Time:** 2 minutes

1. Open the app. The welcome screen reads **Start your fish farming journey with confidence.**
2. Choose **Get Started**.
3. Fill in **Full name** `Maria Santos`, **Email address** `maria.demo@example.com`, **Mobile
   number** `09171234568`, **Password** and **Confirm password** `SafeDemo123!`, tick the terms,
   and choose **Create account**.
4. **Choose your plan** appears, with **Free** selected. Show the Pro card: **Pricing coming
   soon** and **Up to 10 culture systems**.
5. Choose **Continue with Free**.

**Point out:** every farmer starts free with one culture system; the plans differ by how many
ponds, cages or tanks a farmer manages and by the Pro record-keeping tools. Mobile numbers are
accepted in local `09...` form.

### Scene 2 - Planning the first cultivation

**Account:** Maria · **Time:** 4-5 minutes

1. On **Plan your first cultivation**, choose **Start setup**.
2. **What species will you raise?** lists six species: Tilapia, Milkfish (Bangus), Catfish (Hito),
   Grouper (Lapu-lapu), Shrimp (Hipon) and Carp.
3. _Compatibility beat:_ choose **Shrimp (Hipon)**, **Continue**, then **Fish Cage**. A notice says
   **Choose another culture environment** - a floating fish cage does not suit shrimp - and
   **You could consider: Pond.** **Continue** stays disabled. Use the back arrow to return to the
   species.
4. Choose **Tilapia**, **Continue**, then **Pond**: **This setup can be planned**. **Continue**.
5. **Good water for your stock** lists the suggested range of each of the seven parameters for
   tilapia in a pond - for example ammonia **Up to 0.5 mg/L** and dissolved oxygen **At least
   3 mg/L** - each with an explanation, and an **About these figures** note marked **Demo figures,
   not yet reviewed**. **Continue**.
6. **Measure your culture area** opens with the suggested pond size and depth for the chosen fish
   (at least 1.0–1.2 m deep). Choose **Got it**. Enter **Length** `5`, **Width** `4`, **Average
   water depth** `1.5`; the volume shows **30 m³**. **Continue**.
7. **How many fingerlings are you planning?** Enter **Planned fingerlings** `800` and choose
   **Calculate estimate**. The result is **Your plan is above the demo range**, with the space
   the plan would need. **Review cultivation** stays disabled until Maria ticks the
   acknowledgement.
8. Tick the acknowledgement and choose **Review cultivation**.
9. On **Review your cultivation**, enter **Cultivation name (optional)** `Maria's Tilapia Pond` and
   choose **Create cultivation**.
10. **Your cultivation is ready** recommends the **Compact Pond Aerator**. Choose **Buy now:
    Compact Pond Aerator**.
11. The product opens with the quantity preset: **Suggested quantity for your need: 1. You can
    change it.** Scroll to **How to install**: safety cautions (switch off and unplug the aerator
    first), four numbered steps, and a **Demo guide.** label.
12. Optionally choose **Add to cart · ₱1,299.00**. Then choose **Home** in the bottom navigation.

**Point out:** the farmer is never blocked, but going above the range needs a conscious choice;
every figure says it is a demo estimate; the shop appears exactly where the setup needs it, and
the installation guide answers "how do I set this up?".

**Variation - the brief's bangus example:** in step 4, choose **Milkfish (Bangus)** instead of
Tilapia. Step 6's pop-up then reads **For 5,000 fish** - **About 5,000 m² (0.5 ha)**, about 1 m²
per bangus, **At least 1.0–1.2 m** deep. With a 25 × 20 × 1.2 m pond and `5000` fingerlings, the
result says **More space needed**: _5,000 fish need about 5,000 m² (0.5 ha) of water surface
(length × width). Your area has 500 m², so it needs about 4,500 m² (0.45 ha) more, or plan fewer
fish._ With `450` fingerlings the plan is **within the demo range** (**400–500 fish**). On
FastAPI, the aerator is recommended only for tilapia, catfish and carp in a pond or tank, so a
bangus pond finishes without a recommendation.

### Scene 3 - What the Free plan covers, and upgrading

**Account:** Maria, then the operator · **Time:** 2-3 minutes

1. From Home, open **Cultivations**, then **Maria's Tilapia Pond**.
2. Choose **Water log · Pro**. Maria lands on the plans page with **That screen is part of the Pro
   plan.**
3. Choose **Request Pro**. The page confirms the request and the date it was sent; **Request
   Organization** is disabled while the request is pending.
4. Open **Profile**. **Your plan** shows **Free**, **1 of 1 culture system in use** and **Pro
   request pending**.
5. **Operator**, in the second terminal:

   ```powershell
   python -m app.cli set-tier maria.demo@example.com PRO
   ```

   ```text
   maria.demo@example.com is now on PRO (was FREE).
   Upgrade request <request id> for PRO is APPROVED.
   ```

6. Reload the Profile page: **Your plan** now shows Pro with room for 10 culture systems. Open
   the cultivation again - **Water log · Pro** opens.

**Point out:** the API enforces the plan, not just the screen - a Free account asking for Pro data
is refused by the server too. Payments are not built yet, so an operator approves upgrades.

**Variation - the culture-system limit:** before step 5, open `/setup` in the address bar, run the
wizard again with the same answers, and choose **Create cultivation**. The refusal reads **Your
Free plan covers 1 active culture system** and **A harvested cultivation no longer counts.**, with
**See plans**. (Once a farm has a cultivation, `/setup` is the way into the wizard.)

**Mock:** there is no operator command. Show the pending request, then move on to Juan, who is
already on Pro.

### Scene 4 - A day on the farm

**Account:** Juan · **Time:** 3 minutes

1. Sign Maria out (**Profile > Sign out**) and sign in with `juan@example.com` / `Gabayan123!`.
2. Home greets Juan with **Here's today's farm plan.** and features **Tilapia Batch #001**.
3. **Today's tasks** shows the morning feeding done, the water-condition check and the afternoon
   feeding due. After 8:00 AM, the morning feeding of his second pond (Tilapia Harvest Demo) joins
   the list, so the progress reads **1 of 4 done** rather than **1 of 3 done**.
4. Choose **Record feeding** on an open feeding task. The **Record feeding** sheet opens with
   **Actual amount given** prefilled from today's feeding plan. Add **Notes (optional)**
   `Fish responded normally.` and choose **Save feeding record**.
5. **Feeding record saved.** appears and the progress moves up by one.
6. Point to the weather card (**San Pablo City, Laguna** - with the fixed forecast, **No hot or
   cloudy spells are forecast**), the farm overview and the learning tip.

**Point out:** Home answers "what should I do today?" first. The feeding amount comes from the
day's plan - estimated live fish, the latest sample weight and the stage feed rate - and saving
the task and the feeding record happens in one step.

### Scene 5 - The cultivation up close

**Account:** Juan · **Time:** 2 minutes

1. Choose **View cultivation** (or **Cultivations > Tilapia Batch #001**).
2. The overview shows **485** estimated live fish (500 stocked, 15 recorded losses), the stock,
   feeding and harvest summaries, and the setup.
3. Choose **Timeline**: every event of the cultivation, with the **Estimated harvest window**.
4. Choose **Tasks** to see the day's tasks for this pond only.
5. Back on the overview, show the record links: **Growth**, **Farm records**, **Water safety
   check**, **Water log · Pro**, **Feed conversion · Pro** and **Harvest**.

**Point out:** estimated live fish is worked out by the server from the stocking and every
mortality record; nothing is typed in twice.

### Scene 6 - Keeping records

**Account:** Juan · **Time:** 3-4 minutes

1. **Growth** (_Measurements and chart_) > **Add record**: **Fish sampled** `12`, **Average fish
   weight** `200`, **Notes (optional)** `Representative net sample.` > **Save growth record**.
   **Growth record saved.** and **200 g** joins the chart.
2. Go back, then **Farm records** (_Feeding, mortality, and water_).
3. **Mortality** > **Add**: **Number of fish** `5`, **Likely reason** _Unknown_ > **Save mortality
   record**. The screen now reads **Estimated live fish: 480**.
4. **Water** > **Add**: **Water clarity** `Cloudier than usual`, **Fish behavior**
   `Slower near one corner`, tick **I noticed an unusual change** > **Save water check**. The
   guidance says **Review the change promptly** and to seek local technical guidance.
5. **Feed plan**: the **Daily demo estimate**, and **Feed for the Growing stage** - _Tilapia grower
   pellets, floating_, **28–32%** protein, **2–4 mm** pellets, **2 feedings a day**, marked
   **Demo figures, not yet reviewed**.
6. Choose **See the whole Tilapia feed guide**: every stage, with **Your fish now** on the current
   one. Go back.
7. Choose **Buy now: Tilapia Grower Feed 20 kg**: the feed opens with a quantity of 1. Go back.

**Point out:** each record changes something the farmer can see - the chart, the live count, the
guidance. Water observations get conditional advice, never a diagnosis.

### Scene 7 - Water quality

**Account:** Juan · **Time:** 3-4 minutes

1. From **Tilapia Batch #001**, choose **Water safety check**.
2. Enter **pH (scale 0–14)** `7.2` and **Ammonia (mg/L)** `1.2`, then **Check readings**.
   - Ammonia shows **Above range**, **Suggested: Up to 0.5 mg/L**, where it comes from (_fish
     droppings and uneaten feed_) and what to do - consider changing **part** of the water. It
     never says to replace all of it.
   - pH shows **Within range**; the parameters left blank are listed as **Not checked**.
   - **This check is not saved. Pro plans keep a history of your readings.**
3. Add **Dissolved oxygen (mg/L)** `1.5` and check again: **Below range**, with **Products that
   may help with Dissolved oxygen** and **Buy now: Compact Pond Aerator**.
4. Go back and choose **Water log · Pro**. The **History** holds three earlier readings, newest
   first; the most recent (yesterday) has dissolved oxygen **Below range**. The trend opens on
   ammonia (**Ammonia trend with 3 readings**), whose second reading, **0.8 mg/L**, was above
   range.
5. Choose **Log a reading**: **pH** `7.4`, **Ammonia** `0.9`, **Dissolved oxygen** `4.5`, **Notes**
   `Checked before the morning feeding.` > **Save reading**. **Water reading saved.** - the new
   reading tops the history with **1 reading out of range** and the parameters not measured.
6. Go back and choose **Feed conversion · Pro**: the **Feed conversion ratio** as
   _kg of feed for each kg gained_ (1.37 on a fresh seed), with **How this is worked out** - fish
   that died are not counted as weight gained - and **Demo calculation, not yet reviewed**.

**Point out:** Free farmers get the one-off safety check; Pro farmers keep a history and see
trends. The feed conversion ratio - the number that decides a season's profit - is calculated from
records the farmer already keeps; nobody types it in. It changes as records are added, so after
scene 6 it may differ from 1.37.

### Scene 8 - Reminders and notifications

**Account:** Juan · **Time:** 2 minutes

1. On Home, choose the bell (**_N_ unread notifications**).
2. **Notifications** groups today's items first. Show a feeding reminder (**Planned amount**,
   **Demo estimate**), **Partial water change due** (about 30 % of the water, a little at a time -
   never all of it) and **Your fish may be near harvest size** (latest sample **360 g**, demo
   target **350–450 g**, and _you decide when the size is right_).
3. Use the filters **All**, **Cultivation**, **Orders** and **Learning**. Under **Learning**, open
   **Look for changes in feeding response**.
4. Under **Cultivation**, choose **View daily tasks** on the water observation reminder: it opens
   the pond's tasks at **Check water condition**.
5. Open **Profile > Notification preferences**: a switch per reminder type (feeding, water
   maintenance, growth sampling, harvest, orders, tips), **Morning feeding time** `08:00` and the
   afternoon time. Choose **Save preferences** to show **Notification preferences saved.**

**Point out:** reminders are raised when the farmer opens the app - no reminder asks for a full
water change, and the harvest alert only comes from a measured sample; the usual 120–150 days is
shown as a hint.

### Scene 9 - Harvest

**Account:** Juan · **Time:** 2-3 minutes

1. **Cultivations > Tilapia Harvest Demo > Harvest** (_Readiness and completion_).
2. Readiness shows **POTENTIALLY READY** from the latest sample of **360 g** against the demo
   target, with the estimated biomass and the basis.
3. Enter **Fish harvested** `470`, **Total harvest weight** `169.2`, **Average fish weight** `360`,
   **Selling price per kg** `120`, **Notes (optional)** `Harvest completed and weighed.`, then
   choose **Complete cultivation**.
4. **Cultivation completed** with the summary: estimated revenue **₱20,304.00** (169.2 kg ×
   ₱120) and survival **94 %** (470 of 500).
5. Choose **View completed cultivations**: the pond has moved to the completed list.

**Point out:** readiness needs a current measurement, never elapsed days alone; the harvest
record is kept for the farm's history, and a completed cultivation frees a culture-system slot
on the plan.

### Scene 10 - Buying and tracking

**Account:** Juan, then the operator · **Time:** 3-4 minutes

1. Open **Orders**: **GBY-10245** is shipped. Open it and choose **Track order**: order placed,
   payment confirmed (cash on delivery), preparing, shipped with Bayanihan Express, and the steps
   still to come.
2. Back in **Orders**, choose **Shop**. The marketplace heading reads **6 products**, with
   categories and search.
3. Open **Compact Pond Aerator**: **Why this may help**, specifications and the installation
   guide. Choose **Add to cart**; **Added to cart.** appears.
4. Open the cart (**Cart with 1 items**; more if you added items in earlier scenes):
   **Subtotal** ₱1,299.00, **Delivery** ₱150.00, **Estimated total** **₱1,449.00**. Choose
   **Continue to checkout**.
5. Checkout shows the **Farm address** and cash on delivery (GCash and cards are shown as not yet
   available). Choose **Review final total**, then **Place order**.
6. **Order placed** with a new order number (**GBY-10246** on a fresh seed). Choose **Track
   order**: the order has been placed and the remaining steps are **Upcoming**.
7. **Operator:**

   ```powershell
   python -m app.cli advance-order GBY-10245
   ```

   ```text
   GBY-10245 is now OUT_FOR_DELIVERY.
   Current step: Out for delivery - The courier will deliver to your farm address.
   ```

   Reload GBY-10245's tracking to show the new step. Run the command once more for
   **Delivered**.

**Point out:** the server prices the cart and the final total - the app never adds up money on
its own - and a retried order submission can never create a second order. The shop stays a link
from Orders and product pages; the bottom navigation keeps its four destinations.

### Scene 11 - Profile, offline and install

**Account:** Juan · **Time:** 2 minutes

1. **Profile** shows **Dela Cruz Family Fish Farm**, **Personal details**, **Farm profile**,
   **Addresses**, **Notification preferences** and **Your plan** (Pro).
2. **Farm profile > Edit**: change **Experience level** to intermediate and **Save farm profile**
   (**Farm profile updated.**).
3. _Offline:_ in the developer tools, **Network > Offline** (or airplane mode on a phone). A
   **You're offline** banner appears and the data stays readable. Open **Personal details > Edit**:
   **Save details** is disabled, because unsafe writes are not queued silently. Go back online and
   close the dialog.
4. _Install:_ on `127.0.0.1`, `localhost` or an HTTPS site, the browser offers to install the app
   (the install icon in the address bar, or **Install app** in Android Chrome's menu). The
   installed app opens full screen like a native app.

**Point out:** Gabayan is built for patchy mobile data - it tells the farmer when information may
be stale and never pretends a save went through.

### Scene 12 - Weather alerts

**Account:** Maria (or the backup account) · **Time:** 2 minutes · **Needs:** the API started with
`WEATHER_PROVIDER=fixture` (the mock always uses the fixed forecast)

1. Sign in as Maria. Home's weather card asks her to **Add your farm's location**, since she has
   no farm profile yet. Choose **Add farm location**.
2. In **Farm profile**, choose **Create**: **Farm name** `Santos Tilapia Farm`, **City or
   municipality** `Dagupan City`, **Province** `Pangasinan` > **Save farm profile**.
3. Back on **Home**, the weather card shows **Dagupan City, Pangasinan** and an alert **Hot days
   ahead** marked **Advisory**, for the next two days, with the forecast high (around 35 °C), why it
   matters - _warm water holds less oxygen_ - a few steps, and **Demo estimate**.
4. The bell shows the same alert as an unread notification; choose **Mark as read**.

**Point out:** the alert is for the farm's own municipality, explains the risk to the fish, and
never asks for a full water replacement. With the fixed forecast, **Dumangas, Iloilo** gives
**Cloudy days ahead** instead; with the real forecast (`open-meteo`), alerts appear only when the
weather calls for them.

## Suggested run orders

| Length         | Scenes                                                                               | Focus                                                 |
| -------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| **5 minutes**  | 4 (Home and feeding) → 7 steps 1-3 (safety check) → 9 (harvest) → 10 steps 1-6 (buy) | The daily companion, honest guidance, and the shop    |
| **15 minutes** | 1 → 2 → 3 (without the operator) → 4 → 6 → 7 → 9 → 10                                | The full farmer journey from sign-up to harvest       |
| **30 minutes** | All twelve, in order                                                                 | Every feature, including plans, reminders and weather |

For a pitch where the audience cares about the business, keep scene 3 and the operator steps: they
show how the plans work today and where billing will go.

## Operator commands

Run these in `aqua-lens-api` with the virtual environment active. Against an online database, set
`DATABASE_URL` first as in [setup guide 7.4](setup_guide.md#74-step-3---the-demo-account-demo-sites-only).

| What                        | Command                                                          | Result                                                                                           |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Approve an upgrade          | `python -m app.cli set-tier maria.demo@example.com PRO`          | The account moves to Pro; a pending request for Pro is marked approved                           |
| Put an account back on Free | `python -m app.cli set-tier maria.demo@example.com FREE`         | A pending request for a higher plan is marked declined                                           |
| Organization plan           | `python -m app.cli set-tier maria.demo@example.com ORGANIZATION` | Room for 100 culture systems                                                                     |
| Move an order along         | `python -m app.cli advance-order GBY-10245`                      | One step along TO_PAY, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED; refuses after DELIVERED |
| Seed the demo farmer        | `python -m app.cli seed-demo`                                    | Writes Juan's account once; a second run writes nothing                                          |
| Seed for a specific day     | `python -m app.cli seed-demo --date 2026-10-15`                  | Lays the demo out around that day (on an empty database)                                         |
| List the commands           | `python -m app.cli --help`                                       |                                                                                                  |

A password-reset request is answered on screen, and its link is printed in the API's console as a
`Mail not delivered (log adapter)` warning - copy the link from there to show the reset page.

## Reset between runs

**FastAPI** - wipes every account and record, then reseeds:

```powershell
docker compose down -v
docker compose up -d
python -m alembic upgrade head
python -m app.cli seed-demo
```

The API can keep running during the reset. `seed-demo` alone does not undo a demo: it only adds
what is missing.

**Mock** - stop `pnpm dev:all` (`Ctrl+C`), then:

```powershell
pnpm mock:reset
pnpm dev:all
```

In the browser, sign out or clear the site data so the next run starts on the welcome screen.

## Talking points and likely questions

**Who is it for?** Backyard and small-scale growers starting out (Free), growers with several
ponds or cages who want their own water records (Pro), and cooperatives, companies and government
programmes - for example mariculture parks - that manage many culture systems (Organization).

**Why a web app and not an app-store app?** One link works on any phone, it installs to the home
screen without an app store, updates arrive on their own, and it keeps working with patchy data.

**How do you know the advice is right?** It is not presented as right yet. Every figure is a demo
value with its source status, rule version and basis shown to the farmer. The rules are data per
species and culture system, so a qualified reviewer can verify or replace them without changing
the app.

**How does it make money?** Plan subscriptions (Pro and Organization) and the marketplace for
setup tools, water-testing kits and feed. In-app payment for plans is not built yet; upgrades are
approved by an operator.

**What happens without signal?** The app shows the last synchronized data with an offline notice
and disables saves that could go wrong, rather than queueing them silently.

**What is next?** Reviewed biological figures, a payment gateway and courier integration, email
and SMS for account recovery, push notifications, Filipino-language screens, and field testing on
farmers' own phones.

## If something looks different

| What you see                                                          | Why, and what to do                                                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home shows **1 of 4 done** (or more tasks) instead of **1 of 3 done** | After 8:00 AM (and again after 4:30 PM) the second pond's feeding tasks are raised too. Nothing is wrong.                                        |
| Home shows no seeded tasks, only feeding tasks                        | You are on the mock on a day other than 2026-09-23. Use FastAPI seeded today, or narrate with the tasks shown.                                   |
| Harvest readiness asks for a current sample                           | FastAPI was seeded more than two weeks ago. Record a growth sample of 360 g on Tilapia Harvest Demo first, or reset and reseed.                  |
| **An account already uses this email.**                               | Maria exists from an earlier run. Use `maria.demo2@example.com`, or reset.                                                                       |
| Sent back to sign-in after a reload                                   | Local FastAPI: open http://127.0.0.1:5173, not `localhost`. Online: see [setup guide 7.1](setup_guide.md#71-decide-how-the-app-reaches-the-api). |
| **Continue with Google (demo)** fails                                 | Expected on FastAPI. Sign in with the email and password.                                                                                        |
| No weather alert for Dagupan City                                     | The API is using the real forecast. Restart it with `WEATHER_PROVIDER=fixture`, or show Juan's calm forecast instead.                            |
| The order number is not GBY-10246                                     | Orders from earlier runs used the number. The flow is the same.                                                                                  |
| The cart holds more items than expected                               | Items added in earlier scenes stay in the cart. Remove them with **Remove**, or carry on.                                                        |
| Saving fails on a phone                                               | The phone reached the app over plain HTTP. See [setup guide 6](setup_guide.md#6-showing-it-on-a-phone).                                          |
| The first screen takes a long time online                             | A free-tier host was asleep. Open `/api/v1/health` a few minutes before presenting.                                                              |
