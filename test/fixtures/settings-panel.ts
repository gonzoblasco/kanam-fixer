/**
 * Toy component used as the subject of the announcement assertions.
 *
 * It is deliberately ours and deliberately small: depending on a third party
 * repo to prove the assertion works would make the test measure someone
 * else's component, not our own behaviour.
 */

export interface SettingsPanelOptions {
  /**
   * Applies a specific break to the markup. Used to prove the assertion
   * actually detects it, instead of passing for any input.
   */
  break?: 'none' | 'missingGroupName' | 'pressedOnToggleOnly' | 'labelInsteadOfName';
}

/** Renders the settings panel as HTML, with an optional deliberate break. */
export function settingsPanel({ break: broken = 'none' }: SettingsPanelOptions = {}): string {
  const channelsGroup =
    broken === 'missingGroupName'
      ? '<div role="group">'
      : '<div role="group" aria-label="Channels">';

  // A toggle button that carries aria-pressed is announced as "pressed".
  // Dropping it makes the state disappear from the announcement while the
  // button still looks identical on screen.
  const emailPressed = broken === 'pressedOnToggleOnly' ? '' : ' aria-pressed="true"';

  const panelHeading =
    broken === 'labelInsteadOfName'
      ? '<div aria-label="Notification settings">'
      : '<h1>Notification settings</h1>';

  const panelClose = broken === 'labelInsteadOfName' ? '</div>' : '';

  return `
    <main>
      ${panelHeading}
      <form>
        ${channelsGroup}
          <button type="button"${emailPressed}>Email</button>
          <button type="button" aria-pressed="false">SMS</button>
        </div>
      </form>
      ${panelClose}
    </main>
  `;
}
