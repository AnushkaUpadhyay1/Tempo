/** Read-aloud using the Web Speech API, with a safe check for browsers that lack it. */

export function speechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

export function speak(text: string): boolean {
  if (!speechSupported()) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.lang = 'en-GB';
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}
