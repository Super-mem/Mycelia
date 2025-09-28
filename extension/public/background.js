// Background script for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Simple Sidebar Extension installed');
});

// Handle action button clicks
chrome.action.onClicked.addListener(async (tab) => {
  // Open the side panel for the current window
  await chrome.sidePanel.open({
    windowId: tab.windowId
  });
});
