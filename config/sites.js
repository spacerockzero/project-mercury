/**
 * TODO : turn this into a configurably imported repo
 */

module.exports = {
  // reference has to be prod, since its not mounted elsewhere
  'reference': [
    'https://familysearch.org/reference/',
    'https://familysearch.org/reference/bench/',
    'https://familysearch.org/reference/fsorg/',
    'https://familysearch.org/reference/createApp/',
    'https://familysearch.org/reference/cloneApp/',
    'https://familysearch.org/reference/experiments/',
    'https://familysearch.org/reference/authentication/',
    'https://familysearch.org/reference/debugging/',
    'https://familysearch.org/reference/usingModules/',
    'https://familysearch.org/reference/unitTests/',
    'https://familysearch.org/reference/I18N/'
  ],
  // the rest of these can be beta, but should be woken before each test round
  'home': [
    'https://beta.familysearch.org/'
  ],
  'frontier-tree': [
    'https://beta.familysearch.org/tree/#view=tree&section=pedigree',
    'https://beta.familysearch.org/tree/#view=tree&section=descendancy',
    'https://beta.familysearch.org/tree/#view=tree&section=fan',
    'https://beta.familysearch.org/tree/#view=tree&section=portrait',
    'https://beta.familysearch.org/tree/#view=ancestor'
  ],
  'photos': [
    'https://beta.familysearch.org/photos/',
    'https://beta.familysearch.org/photos/images/'
  ]
};
