// Fix React DOM errors before they happen
(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;
  
  // Patch removeChild to handle null cases
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (!child || !this.contains(child)) {
      // Silently handle
      return child;
    }
    try {
      return originalRemoveChild.call(this, child);
    } catch (e) {
      // Silently handle error
      return child;
    }
  };
  
  // Patch insertBefore to handle null cases
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    if (!newNode) {
      // Silently handle
      return null;
    }
    try {
      return originalInsertBefore.call(this, newNode, referenceNode);
    } catch (e) {
      // Silently handle error
      return newNode;
    }
  };
  
  // Patch appendChild to handle null cases
  const originalAppendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function(child) {
    if (!child) {
      // Silently handle
      return null;
    }
    try {
      return originalAppendChild.call(this, child);
    } catch (e) {
      // Silently handle error
      return child;
    }
  };
})();