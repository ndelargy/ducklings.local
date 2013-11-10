/**
 * Additional content section / block functions for body.
 */

var rootpath = process.cwd() + '/', path = require('path'), calipso = require(path.join(rootpath, 'lib/calipso'));

exports = module.exports = function (req, options, callback) {

  var alias;
  /**
   *  Get additional content for blocks in the template
   */
  calipso.lib.step(

    function getContent() {

      options.getBlock("screens.item.body", this.parallel());
      // options.getBlock("screenstest_renderItem", this.parallel());
      return "Some raw content.";

    }, function done(err, body, var2, raw) {
      // options has req, res, other options added by modules.
      callback(err, {
        body:body,
        var2:var2,
        raw:raw
      });
    });

};
