# Worked example: the cart

This follows one feature of [playwright-e2e-demo](https://github.com/benweese/playwright-e2e-demo), the shopping cart on [automationexercise.com](https://automationexercise.com), through every stage of the plugin. It's the feature where the most happened: review changed how its plan locates elements, and it's the one test in the suite that needed the healer.

Links point at the files as committed in [`fd06ed7`](https://github.com/benweese/playwright-e2e-demo/commit/fd06ed7746d73a453c3812c055033e13924529a5), so the line numbers stay put. The reviewed plans were committed afterwards, in [`8448ba2`](https://github.com/benweese/playwright-e2e-demo/commit/8448ba2357729dd8643b4ad602390e83ea09c364), and links to the plan are pinned to that commit.

```
page-mapper → ui-test-planner → review → ui-test-generator → run → ui-test-healer → review
```

## 1. Page map

The page-mapper agent opened `/view_cart` in its own browser session (`-s=map-cart`), added products, removed them, emptied the cart, and wrote what it saw to [`docs/pages/view-cart.md`](https://github.com/benweese/playwright-e2e-demo/blob/fd06ed7746d73a453c3812c055033e13924529a5/docs/pages/view-cart.md).

The parts that mattered later:

- **The remove control** ([lines 47–51](https://github.com/benweese/playwright-e2e-demo/blob/fd06ed7746d73a453c3812c055033e13924529a5/docs/pages/view-cart.md#L47-L51)) is an icon-only anchor with no href and no accessible name, but it carries `data-product-id`. Removing the last product hides the table and shows "Cart is empty! Click here to buy products."
- **Notes** ([lines 80–83](https://github.com/benweese/playwright-e2e-demo/blob/fd06ed7746d73a453c3812c055033e13924529a5/docs/pages/view-cart.md#L80-L83)): every product card is in the DOM twice (card and hover overlay), rapid adds can race, and on the checkout button "possibly the click landed before page scripts were ready".

That last note described the bug the healer would fix later, but on a different control. Nobody connected the two until the test failed.

The map also got things wrong. It recommended `page.locator("#product-1 .cart_quantity_delete")` (an id plus a class name) and mentioned `.first()`, both against the repo's locator rules. A map records what the page does and is only a reference. The planner and generator have to apply the rules, and here they did. This build is also why page-mapper now follows the repo's locator rules (v0.9.0).

## 2. Plan

The ui-test-planner turned the site's published test cases 12, 13 and 17, plus the map, into [`plans/ui-cart.md`](https://github.com/benweese/playwright-e2e-demo/blob/8448ba2357729dd8643b4ad602390e83ea09c364/plans/ui-cart.md): five [acceptance criteria](https://github.com/benweese/playwright-e2e-demo/blob/8448ba2357729dd8643b4ad602390e83ea09c364/plans/ui-cart.md#L10-L16) and seven scenarios, `#0032`–`#0038`. The ones that matter for the rest of this example:

- **[AC-4 and AC-5](https://github.com/benweese/playwright-e2e-demo/blob/8448ba2357729dd8643b4ad602390e83ea09c364/plans/ui-cart.md#L15-L16):** removing a product removes it from the cart (test case 17), and an empty cart says "Cart is empty!" and links to the products page. AC-5 is derived, and the plan records its approval.
- **[#0037](https://github.com/benweese/playwright-e2e-demo/blob/8448ba2357729dd8643b4ad602390e83ea09c364/plans/ui-cart.md#L113-L125)** removes the only product, and expects the row to be gone and "Cart is empty!" to show with its link to the products page.

The plan also listed [what the site would need](https://github.com/benweese/playwright-e2e-demo/blob/8448ba2357729dd8643b4ad602390e83ea09c364/plans/ui-cart.md#L143-L149) for clean locators. The "Added!" modal has no `role="dialog"`, the remove control has no `aria-label`, and the grid's "Add to cart" link has no role at all.

## 3. Review

The plan stopped for review, as `author-tests` does. The cart decisions:

- **Locators.** The planner reported that the grid's "Add to cart" (needed by #0032 and #0036) couldn't be written under the locator rules: it has no role, it appears twice per card, and it has no usable container. I restored stable `data-*` attributes to the rules in the repo's [`tests/ui/CLAUDE.md`](https://github.com/benweese/playwright-e2e-demo/blob/fd06ed7746d73a453c3812c055033e13924529a5/tests/ui/CLAUDE.md#L87-L90), and allowed exactly two ids for icon-only buttons elsewhere. The planner rewrote the cart plan to use `[data-product-id]`: inside the product's row for remove, and on the grid for add.
- **Derived scenarios.** #0035 (the same product added twice sums to one row) and #0038 (an empty cart for a new session) aren't in the site's docs. I kept them, and the plan records the approval, so the plan is their source of truth.
- **Tags.** #0032, #0034 and #0036 carry `@smoke` as well as `@ui`. I kept both, and CI runs `--project=api --project=ui` so no test runs twice.
- **Invalid quantities** (0 and -1 go into the cart) stayed an open question. The docs don't say what should happen, so no test asserts it. It's listed in the e2e README under "Observed, not tested".

## 4. Generated code

The ui-test-generator explored the live page in its own session and wrote three layers:

- **Locators:** [`tests/ui/locators/cartLocators.ts`](https://github.com/benweese/playwright-e2e-demo/blob/fd06ed7746d73a453c3812c055033e13924529a5/tests/ui/locators/cartLocators.ts). A product's row is found through its link ([line 13](https://github.com/benweese/playwright-e2e-demo/blob/fd06ed7746d73a453c3812c055033e13924529a5/tests/ui/locators/cartLocators.ts#L13)), and the remove control is the `data-product-id` inside that row ([line 22](https://github.com/benweese/playwright-e2e-demo/blob/fd06ed7746d73a453c3812c055033e13924529a5/tests/ui/locators/cartLocators.ts#L22)): a good container first, then the element.
- **Page object:** [`tests/ui/pages/CartPage.ts`](https://github.com/benweese/playwright-e2e-demo/blob/fd06ed7746d73a453c3812c055033e13924529a5/tests/ui/pages/CartPage.ts), one method per user action, built on commons' `BasePage`.
- **Spec:** [`tests/ui/specs/cart.spec.ts`](https://github.com/benweese/playwright-e2e-demo/blob/fd06ed7746d73a453c3812c055033e13924529a5/tests/ui/specs/cart.spec.ts). Each test starts with a fresh, empty-cart session, and #0036 and #0037 are at [lines 132–190](https://github.com/benweese/playwright-e2e-demo/blob/fd06ed7746d73a453c3812c055033e13924529a5/tests/ui/specs/cart.spec.ts#L132-L190).

The plan's suggestion for the grid's "Add to cart" (`[data-product-id]` with `.filter({ visible: true })`) didn't work, because both copies count as visible. The generator fell back to `img ~ [data-product-id="…"]`, which is outside the rules, and left a `// Fixme:` saying what it tried and what the site needs ([`productsLocators.ts` lines 25–28](https://github.com/benweese/playwright-e2e-demo/blob/fd06ed7746d73a453c3812c055033e13924529a5/tests/ui/locators/productsLocators.ts#L25-L28)). At the second review I asked whether these locators were solid, and kept the Fixme. The ui-test-planner now says never to suggest a technique the page reference hasn't shown to work, such as a visibility filter.

All seven cart tests passed on the first run.

## 5. Healer run

A later full run at two workers failed #0037. After the click on remove, the row was still visible after 5 seconds and "Cart is empty!" never appeared. It had passed in three earlier full runs.

The ui-test-healer got the failure, the repo's rules, and a fixed budget: locators and waits only, no change to what the test asserts, three attempts. It:

1. Read the page object, the locators and the test, and opened `/view_cart` in its own session (`-s=heal`).
2. Fetched the site's `/static/js/cart.js`. It binds the remove handler directly, in a script at the end of the page, not in a ready callback. The control is an anchor with no href, so a click that lands before that script runs does nothing: no request, no error. Playwright's actionability checks can't see it, because the element is already visible. That matched the symptoms: the locator found the row, but nothing happened.
3. Changed `removeProduct` to wait for the page's `load` event and for the `/delete_cart/<id>` response. The locator and the test's assertions stayed as they were.
4. Ran `cart.spec.ts` with `--repeat-each=3`: 23 of 23 passed, including setup and teardown. It used **1 of 3 attempts**.

The healer said plainly that the fix was "not fully proven": it couldn't reproduce the original failure on demand, so the diagnosis came from the site's script and the symptoms, not from catching the race. Waiting for the response is still the right fix, because the test should never assert before the site has acted. The healer also flagged two things. Its own instructions said to mark site bugs `test.fixme()`, which this repo forbids, so it followed the repo. And `BasePage` had no wait-for-response helper, so it suggested moving one into commons.

## 6. Final diff

`removeProduct` in `CartPage.ts`, as the generator wrote it, as the healer left it, and as committed:

```diff
 async removeProduct(name: string, id: number) {
-	await this.click(this.locators.removeButton(name, id));
+	// cart.js binds the remove handler when it runs at the end of the body; a click before that does nothing.
+	await this.waitForLoad();
+	await this.clickAndWaitForResponse(this.locators.removeButton(name, id), (response) =>
+		response.url().endsWith(`/delete_cart/${id}`)
+	);
 }
```

The healer wrote the fix with raw Playwright: `waitForLoadState("load")` and a `waitForResponse` promise around the click. At the final review I took its suggestion, since waiting for a late-bound control is useful on any site. The helper moved into [playwright-test-commons v0.7.0](https://github.com/benweese/playwright-test-commons/blob/v0.7.0/src/ui/BasePage.ts#L275-L302) as `BasePage.waitForLoad()` and `clickAndWaitForResponse()`, and the page object now calls those ([`CartPage.ts` lines 85–91](https://github.com/benweese/playwright-e2e-demo/blob/fd06ed7746d73a453c3812c055033e13924529a5/tests/ui/pages/CartPage.ts#L85-L91)). The test itself never changed.

## What it cost

Token use for the agents in this build, read from the session logs. All agents ran on Sonnet. Most input is cache reads, which cost far less than fresh input.

| Stage                                                          | Fresh input | Cache reads | Output |
| -------------------------------------------------------------- | ----------- | ----------- | ------ |
| page-mapper, cart page only                                    | 55k         | 0.62M       | 12k    |
| ui-test-planner, all 7 UI plans (38 scenarios)                 | 160k        | 1.04M       | 35k    |
| ui-test-generator, all 7 UI specs, including review follow-ups | 365k        | 7.24M       | 86k    |
| ui-test-healer, #0037                                          | 22k         | 0.18M       | 4k     |

The planner and generator each handled all seven UI areas in one run, so the cart's share isn't separable. Dividing by seven gives a rough per-feature figure: about 75k fresh input, 1.2M cache reads and 17k output for planning and generating one feature. See [Limitations](../README.md#limitations) for the whole build.
