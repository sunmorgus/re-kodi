ReKodi.controller('MusicCtrl', ['$scope', '$timeout', '$state', '$stateParams', '$localStorage', 'KodiFilesService', 'EVENTS', 'LEVELS', 'KODI_ENUMS', 'KodiApiService', 'requestProperties', 'PersitentState',
  function($scope, $timeout, $state, $stateParams, $localStorage, KodiFilesService, EVENTS, LEVELS, KODI_ENUMS, KodiApiService, requestProperties, PersitentState){
    var kodiApi, isInitialized;
    $scope.levels = LEVELS;
    $scope.activeTab = $stateParams.activeTab;
    $scope.status = {
      files: {
        level: LEVELS.SOURCES,
        directory: null
      },
      library: {
        level: LEVELS.ARTISTS,
        artists: null,
        artistsIndex: null,
        album: null
      },
      addons: {
        level: LEVELS.ADDONS,
        addon: null
      }
    };
    
    $scope.data = {
      sources: [],
      directories: {},
      artists: {},
      artistsIndex: [],
      albums: {},
      songs: {},
      addons: [],
      addon: {}
    };
    
    $scope.tabs = [{
      icon: 'mdi-format-list-bulleted',
      label: 'Library',
      content: 'views/partials/music/library.html'
    }, {
      icon: 'mdi-file-music',
      label: 'Files',
      content: 'views/partials/music/files.html'
    }, {
      icon: 'mdi-puzzle',
      label: 'Addons',
      content: 'views/partials/music/addons.html'
    }];
  
    function getDefaultIndex(artistsIndex) {
      if($stateParams.displayIndex !== null) {
        return $stateParams.displayIndex;
      }
      
      for(var key in artistsIndex) {
        if(artistsIndex.hasOwnProperty(key) && artistsIndex[key].toLowerCase() !== artistsIndex[key].toUpperCase()) {
          return artistsIndex[key];
        }
      }
      
      return null;
    }
  
    function setArtists(artists) { 
      for(var key in artists) {
        var firstLetter = artists[key].label.charAt(0).toUpperCase();
        if($scope.data.artists[firstLetter] === undefined) $scope.data.artists[firstLetter] = [];
        $scope.data.artists[firstLetter].push(artists[key]);
      }

      $scope.data.artistsIndex = Object.keys($scope.data.artists);
      $scope.status.library.artistsIndex = getDefaultIndex($scope.data.artistsIndex);
    }

    $scope.getInitalData = function() {
      if(!kodiApi) return;
      $scope.$root.$emit(EVENTS.LOADING, true);
      var batch = kodiApi.batch();
      var sources = batch.Files.GetSources({
        media: KODI_ENUMS.MUSIC,
        sort: {
          order: 'ascending',
          method: 'label'
        }
      });
      var artists = batch.AudioLibrary.GetArtists({
        albumartistsonly: true,
        sort: {
          order: 'ascending',
          method: 'label'
        }
      });
      var addons = batch.Addons.GetAddons({
        type: KODI_ENUMS.AUDIO_ADDONS,
        properties: requestProperties.addons.audio
      });
      
      sources.then(function(data) {
        $scope.data.sources = (data.sources)? data.sources : [];
      }, function(error) {
        console.dir(error);
      });
      
      artists.then(function(data) {
        data.artists = (data.artists)? data.artists : [];
        setArtists(data.artists);
      }, function(error) {
        console.dir(error);
      });
      
      addons.then(function(data) {
        $scope.data.addons = (data.addons)? data.addons : [];
        $scope.$root.$emit(EVENTS.LOADING, false);
      }, function(error) {
        console.dir(error);
        $scope.$root.$emit(EVENTS.LOADING, false);
      });
      
      batch.send();
      isInitialized = true;
    };

    
    function init() {
      kodiApi = KodiApiService.getConnection();
      $scope.getInitalData();
        
      $scope.$root.$on(EVENTS.CONNECTION_STATUS, function (event, connection) {
        kodiApi = connection;
        if(!isInitialized) {
          $scope.getInitalData();
        }
      });
      
      $scope.$watch('status.library.artistsIndex', function(newValue, oldValue) {
        if(newValue === null || newValue === oldValue) {
          return;
        }

        PersitentState.go($state.current.name, {
          activeTab: $stateParams.activeTab,
          displayIndex: newValue
        }, true);
      });
    }
    
    $timeout(init);
  }
]);

