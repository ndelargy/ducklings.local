calipso-screenswiki
===================
This is a module under calipso, a CMS under node.js. 
check out http://github.com/cliftonc/calipso. 

This module allows you to create and manage the HTML screens of for your new product. You should be able to install Calipso CMS locally, and install this module. The module will use content type called 'screen', and use "/screens" namespace to let user see an independent app as opposed to CMS interfaces.

The key features currently implemented are:
* Create screens with clickable links (and with example data) so as to get 
  realistic feel. We are using bootstrap currently, but you can change the appropriate theme templates and use any other CSS and scripts. 
* Different sections like header, sidebars etc. can be defined as partials 
  once in one source file and used by reference in other screens. See "partials" section below.  

We want to implement many more ideas considering ease of use etc. (Let us discuss within this project's issue tracking list.) 
* Can we create more Wiki like experience, cutting down on use of HTML? We can easily use markdown. But considering that we need fine control over CSS etc., how well wiki concept will work for near-final mockups?
* Allow moving div's within its containing div and thus automatically determine margins and borders. Increase and decrease margins and borders with ease. And then save the final values to underlying style file.
* Allow management of micro templates, for reusing smaller parts of screen. For e.g. providing a set of OK and Cancel buttons in different themes as partials.
* Open tasks:
   * No support for permissions as yet.
   * Provide "New screen" capability. Currently you can use CMS's admin management to do the same.

User Interface
==============
    /screens: Lists all the screens.
    /screens/alias/name.html: View the screen with name=alias.
    /screens/id/id: View the screen with id=id. 
    Edit option is available from within screens. 

Partials
========
The idea is that different parts of web page are reusable. So you could define them in one screen and reuse in other pages by reference.

The syntax (in destination page) is:
     <div partial_src="screenname" partial_id="id" partial_version="1.0">

When used within a screen, the system will fetch the content file with alias set to 'partial_src'. And then does a DOM parsing and gets the innerHTML of the node with id partial_id, and attribute partial_version matching.  

(Note: Currently versions are not supported.)

All screens should be DOM compliant.
