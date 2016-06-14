var test = require('tape'),
    fixtures = require('../');

test('fixtures', function(t) {
    t.ok(fixtures.geometry, 'creates geometry fixtures');
    t.ok(fixtures.featurecollection, 'creates featurecollection fixtures');
    t.ok(fixtures.feature, 'creates feature fixtures');
    t.ok(fixtures.all, 'generates all');
    t.end();
});
