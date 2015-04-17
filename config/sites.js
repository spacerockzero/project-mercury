/**
 * TODO : turn this into a configurably imported repo
 */

module.exports = {
  // reference has to be prod, since its not mounted elsewhere
  'reference': [
    'https://familysearch.org/reference/blank/',
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
    'https://beta.familysearch.org/photos/images/',
    'https://beta.familysearch.org/photos/people/',
    'https://beta.familysearch.org/photos/stories/'
  ],
  'identity': [
    'https://beta.familysearch.org/profile/account'
  ],
  'registration': [
    'https://beta.familysearch.org/register/'
  ],
  'search': [
    'https://beta.familysearch.org/search/',
    'https://beta.familysearch.org/search/record/results?count=20&query=%2Bgivenname%3Asteve',
    'https://beta.familysearch.org/ark:/61903/1:1:VR29-SVH',
    'https://beta.familysearch.org/pal:/MM9.3.1/TH-1971-27754-1287-21?cc=2000219',
    'https://beta.familysearch.org/family-trees',
    'https://beta.familysearch.org/catalog-search',
    'https://beta.familysearch.org/learn/wiki/en/Main_Page'
  ],
  'my-booklet': [
    'https://beta.familysearch.org/myfamily/booklet/#/R',
    'https://beta.familysearch.org/myfamily/booklet/finish-page#/'
  ],
  'indexing': [
    'https://beta.familysearch.org/indexing/',
    'https://beta.familysearch.org/indexing/projects',
    'https://beta.familysearch.org/indexing/help'
  ]
};
