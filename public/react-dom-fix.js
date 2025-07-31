// Fix React DOM errors before they happen
(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;
  
  // Patch removeChild to handle null cases
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (!child || !this.contains(child)) {
      console.warn('Attempted to remove non-existent child');
      return child;
    }
    try {
      return originalRemoveChild.call(this, child);
    } catch (e) {
      console.warn('RemoveChild error caught and suppressed:', e.message);
      return child;
    }
  };
  
  // Patch insertBefore to handle null cases
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    if (!newNode) {
      console.warn('Attempted to insert null node');
      return null;
    }
    try {
      return originalInsertBefore.call(this, newNode, referenceNode);
    } catch (e) {
      console.warn('InsertBefore error caught and suppressed:', e.message);
      return newNode;
    }
  };
  
  // Patch appendChild to handle null cases
  const originalAppendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function(child) {
    if (!child) {
      console.warn('Attempted to append null child');
      return null;
    }
    try {
      return originalAppendChild.call(this, child);
    } catch (e) {
      console.warn('AppendChild error caught and suppressed:', e.message);
      return child;
    }
  };
})();