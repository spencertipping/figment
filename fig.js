// Unified Figment configuration | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This configuration transforms a regular caterwaul function into a Figment compiler, complete with some default semantics and a require() function for platform-specific inclusion of external
// code. See the dependent files fig.parser.js, fig.semantics.js, and fig.require.js for more details.

  caterwaul.configuration('fig', function () {this.configure('fig.require fig.semantics fig.parser')});
// Generated by SDoc 
