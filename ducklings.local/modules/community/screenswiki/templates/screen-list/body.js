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
      options.getBlock("screenslist", this.parallel());

    }, function done(err, results) {
      // options has req, res, other options added by modules.
      alias = req.moduleParams.alias;
      // DONT CHANGE THIS: verified that we have valid results in this object.
      callback(err, {
        'screenslist':results,
        'adminActions':"None for now."
      });
    });

};
