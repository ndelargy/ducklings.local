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

      options.getBlock("screen.view", this.parallel());
      options.getBlock("screen.raw", this.parallel());
      options.getBlock("screen.list", this.parallel());
      options.getBlock("screen.adminActions", this.parallel());


    }, function done(err, results) {
      // options has req, res, other options added by modules.
      alias = req.moduleParams.alias;
      callback(err, results);
    });

};
