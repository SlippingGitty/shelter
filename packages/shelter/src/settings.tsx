// Injects a section into user settings

import getDispatcher from "./getDispatcher";
import { awaitDispatch, getFiber, reactFiberWalker } from "./util";

export async function initSettings() {
  const FluxDispatcher = await getDispatcher();

  let firstDispatch = true;
  let canceled = false;

  const cb = async () => {
    // wait for lazy loading on initial user settings open
    if (firstDispatch) {
      await awaitDispatch("USER_PROFILE_FETCH_SUCCESS");
      firstDispatch = false;
    }

    // I <3 async
    if (canceled) return;

    // microtask is necessary to allow react to finish rendering the ui before we run
    queueMicrotask(() => {
      const sidebar = document.querySelector("nav > [role=tablist]");
      if (!sidebar) return;

      const changelogIdx = [...sidebar.children].findIndex(
        (c) => reactFiberWalker(getFiber(c), "id", true)?.pendingProps?.id === "changelog"
      );
      if (changelogIdx === -1) return;

      // indexes are kinda fucky so idk?
      const dividerAboveChangelog = sidebar.children[changelogIdx];

      const tabClasses = sidebar.children[changelogIdx + 1].className;
      const dividerClasses = dividerAboveChangelog.className;
      const headerClasses = sidebar.firstElementChild.className;

      const shelterDivider = <div class={dividerClasses} />;

      const shelterHeader = (
        <div class={headerClasses} role="button" tabIndex="-1">
          Shelter
        </div>
      );

      const shelterTab = (
        <div
          class={tabClasses}
          role="tab"
          aria-selected={false}
          aria-disabled={false}
          tabIndex="-1"
          aria-label="Test tab"
        >
          Test tab
        </div>
      );

      sidebar.insertBefore(shelterDivider as Element, dividerAboveChangelog);
      sidebar.insertBefore(shelterHeader as Element, dividerAboveChangelog);
      sidebar.insertBefore(shelterTab as Element, dividerAboveChangelog);
    });
  };

  FluxDispatcher.subscribe("USER_SETTINGS_MODAL_OPEN", cb);

  return () => {
    FluxDispatcher.unsubscribe("USER_SETTINGS_MODAL_OPEN", cb);
    canceled = true;
  };
}
