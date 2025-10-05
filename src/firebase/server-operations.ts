import {
  addDoc,
  CollectionReference,
} from 'firebase/firestore';

/**
 * Server-side version of addDocumentNonBlocking.
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlockingServer(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      console.error('Error adding document to Firestore:', error);
      // On server-side, we just log the error instead of emitting events
    });
  return promise;
}