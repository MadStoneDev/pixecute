import { ArtworkObject } from "@/types/canvas";

const HISTORY_SESSION = "history";

const clearHistory = () => {
  localStorage.removeItem(HISTORY_SESSION);
};

const updateHistory = (artworkObject: ArtworkObject) => {
  const history = JSON.parse(localStorage.getItem(HISTORY_SESSION) || "[]");
  history.push(artworkObject);
  localStorage.setItem(HISTORY_SESSION, JSON.stringify(history));
};

const undo = () => {
  const history = JSON.parse(localStorage.getItem(HISTORY_SESSION) || "[]");
  if (history.length > 0) {
    const last = history.pop();
    if (last) {
      updateHistory(last);
    }
  }
};

const redo = () => {
  const history = JSON.parse(localStorage.getItem(HISTORY_SESSION) || "[]");
  if (history.length > 0) {
    const last = history.pop();
    if (last) {
      updateHistory(last);
    }
  }
};

export { clearHistory, updateHistory, undo, redo };
