var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , sinonAsPromised = require('sinon-as-promised')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('CacheListingController tests', function() {

  var CacheService
    , scope
    , $rootScope
    , ctrl
    , $location
    , $timeout;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_CacheService_, $injector){
    $timeout = $injector.get('$timeout');
    $location = $injector.get('$location');
    CacheService = sandbox.mock(_CacheService_);
  }));

  beforeEach(inject(function(_$rootScope_, $controller){
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    scope.options = {};
    ctrl = $controller('CacheListingController', {$scope: scope});
    scope.$apply();
  }));

  beforeEach(angular.mock.inject(function ($q) {
    sinonAsPromised($q);
  }));

  it('should create the CacheListingController', function() {
    should.exist(ctrl);
  });

  it('should emit generate format', function() {
    var spy = sandbox.spy(scope, '$emit');
    scope.generateFormat(mocks.cacheMocks.xyzCache, 'xyz');

    spy.calledOnce.should.be.equal(true);
    spy.alwaysCalledWithExactly('generateFormat', mocks.cacheMocks.xyzCache, 'xyz').should.be.equal(true);
  });

  it('should emit show cache extent events', function() {
    var spy = sandbox.spy($rootScope, '$broadcast');
    scope.mouseOver(mocks.cacheMocks.xyzCache);
    $timeout.flush(501);
    spy.calledOnce.should.be.equal(true);
    spy.calledWith('showCacheExtent', mocks.cacheMocks.xyzCache).should.be.equal(true);
  });

  it('should emit hide cache extent events', function() {
    var spy = sandbox.spy($rootScope, '$broadcast');
    scope.mouseOut(mocks.cacheMocks.xyzCache);
    spy.calledOnce.should.be.equal(true);
    spy.calledWith('hideCacheExtent', mocks.cacheMocks.xyzCache).should.be.equal(true);
  });

  it('should emit show cache events', function() {
    var spy = sandbox.spy($rootScope, '$broadcast');
    scope.mouseClick(mocks.cacheMocks.xyzCache);
    $timeout.flush(501);
    spy.calledOnce.should.be.equal(true);
    spy.calledWith('showCache', mocks.cacheMocks.xyzCache).should.be.equal(true);
  });

  it('should emit hide cache extent events', function() {
    var spy = sandbox.spy($rootScope, '$broadcast');
    scope.mouseClick(mocks.cacheMocks.xyzCache);
    $timeout.flush(501);
    scope.mouseClick(mocks.cacheMocks.xyzCache);
    spy.calledTwice.should.be.equal(true);
    spy.calledWith('showCache', mocks.cacheMocks.xyzCache).should.be.equal(true);
    spy.calledWith('hideCache', mocks.cacheMocks.xyzCache).should.be.equal(true);
  });

  it('should set the map filter', function() {
    $rootScope.$broadcast('cacheFootprintPopupOpen', mocks.cacheMocks.xyzCache);
    scope.$apply();
    scope.mapFilter.should.be.equal(mocks.cacheMocks.xyzCache.id);
  });

  it('should unset the map filter', function() {
    $rootScope.$broadcast('cacheFootprintPopupClose');
    scope.$apply();
    should.not.exist(scope.mapFilter);
  });

  it('should emit the cache filter changed', function() {
    var spy = sandbox.spy(scope, '$emit');
    scope.cacheFilter = '5';
    scope.mapFilter = '6';
    scope.$apply();

    spy.calledOnce.should.be.equal(true);
    spy.alwaysCalledWithExactly('cacheFilterChange', {cacheFilter: '5', mapFilter: '6'}).should.be.equal(true);
  });

  it('should create tiles', function() {
    var cache = JSON.parse(JSON.stringify(mocks.cacheMocks.xyzCache));
    var spy = sandbox.spy(scope, '$emit');

    CacheService.expects('createCacheFormat').yields({}).alwaysCalledWith(mocks.cacheMocks.xyzCache, 'xyz');
    scope.createTiles(cache, 0, 1);
    cache.minZoom.should.be.equal(0);
    cache.maxZoom.should.be.equal(1);
    cache.formats.xyz.generating.should.be.equal(true);
    spy.calledOnce.should.be.equal(true);
    spy.alwaysCalledWithExactly('refreshCaches').should.be.equal(true);
  });

});
