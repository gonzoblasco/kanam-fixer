/**
 * Witness case: radix-ui/primitives #4109 and #4110.
 *
 * Real case, verified 2026-09-15 against the issues themselves:
 *
 *  - #4109 added computed aria-posinset / aria-setsize to Select.Item, set
 *    from the DOM in useLayoutEffect. The attributes end up correct and the
 *    unit tests are green.
 *  - #4110 (still open) reports that, with no value preselected, the FIRST
 *    option announces nothing to VoiceOver + Chrome: a timing race between
 *    the item mounting and the announcement.
 *
 * So: attributes correct in the DOM, unit tests green, announcement broken.
 *
 * This fixture models the two dimensions that matter separately:
 *
 *  - `correct`     - position attributes present from the start.
 *  - `timingRace`  - position attributes are applied by a mount effect, i.e.
 *                    NOT present at the moment the list opens.
 *
 * `settle()` is that mount effect. Calling it or not is how the experiment
 * controls WHEN the announcement is observed, which is the whole question.
 */

export const WITNESS_OPTIONS = ['None', 'One', 'Two', 'Three'] as const;

export type WitnessVariant = 'correct' | 'timingRace';

/** Markup as it exists at the moment the list opens. */
export function witnessHtml(variant: WitnessVariant): string {
  const options = WITNESS_OPTIONS.map((label, index) => {
    const isFirst = index === 0;
    const missingPosition = variant === 'timingRace' && isFirst;

    const position = missingPosition
      ? ''
      : ` aria-posinset="${index + 1}" aria-setsize="${WITNESS_OPTIONS.length}"`;

    return `<li role="option" id="witness-option-${index}"${position} aria-selected="false">${label}</li>`;
  }).join('');

  return `<ul role="listbox" aria-label="Fruits">${options}</ul>`;
}

/** The mount effect: it computes and applies the first option's position. */
export function settleWitness(variant: WitnessVariant): void {
  if (variant !== 'timingRace') {
    return;
  }

  const first = document.getElementById('witness-option-0');
  first?.setAttribute('aria-posinset', '1');
  first?.setAttribute('aria-setsize', String(WITNESS_OPTIONS.length));
}

export interface OptionPosition {
  label: string;
  posinset: string | null;
  setsize: string | null;
}

/** Reads the position attributes straight from the DOM, like a unit test. */
export function optionPositions(): OptionPosition[] {
  return WITNESS_OPTIONS.map((label, index) => {
    const element = document.getElementById(`witness-option-${index}`);
    return {
      label,
      posinset: element?.getAttribute('aria-posinset') ?? null,
      setsize: element?.getAttribute('aria-setsize') ?? null,
    };
  });
}
