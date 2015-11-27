// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

angular
  .module('openproject.workPackages.directives')
  .directive('workPackageComment', workPackageComment);

function workPackageComment($rootScope, $timeout, $location, EditableFieldsState, FocusHelper, I18n,
  inplaceEditMultiStorage, ConfigurationService, AutoCompleteHelper, NotificationsService) {

  function commentFieldDirectiveController($scope, $element) {
    var field = {},
        commentStore = inplaceEditMultiStorage.stores.comment;

    $scope.field = field;

    var ctrl = this;
    ctrl.state = EditableFieldsState;
    ctrl.field = 'activity-comment';

    ctrl.editTitle = I18n.t('js.label_add_comment_title');
    ctrl.saveTitle = I18n.t('js.label_add_comment');
    ctrl.cancelTitle = I18n.t('js.label_cancel_comment');
    ctrl.placeholder = I18n.t('js.label_add_comment_title');

    ctrl.state.isBusy = false;
    ctrl.isEditing = ctrl.state.forcedEditState;
    ctrl.isRequired = true;
    ctrl.canAddComment = !!ctrl.workPackage.links.addComment;

    ctrl.showAbove = ConfigurationService.commentsSortedInDescendingOrder();

    ctrl.isEmpty = function() {
      return !ctrl.writeValue.raw;
    };

    ctrl.isEditable = function() {
      return true;
    };

    ctrl.submit = function() {
      if (ctrl.isEmpty()) {
        return;
      }

      inplaceEditMultiStorage.save();
    };

    ctrl.initialize = function(withText) {
      ctrl.writeValue = { raw: '' };

      if (withText) {
        if (!ctrl.writeValue.raw) {
          ctrl.writeValue.raw = '';
        } else {
          ctrl.writeValue.raw += '\n';
        }
        ctrl.writeValue.raw += withText;
      }

      field.value = ctrl.writeValue;
      commentStore.value = field.value;
    };
    ctrl.initialize();

    ctrl.startEditing = function(withText) {
      ctrl.isEditing = true;
      ctrl.markActive();
      ctrl.initialize(withText);

      $timeout(function() {
        var inputElement = $element.find('.focus-input');
        FocusHelper.focus(inputElement);
        inputElement.triggerHandler('keyup');
        ctrl.markActive();
        inputElement.off('focus.inplace').on('focus.inplace', function() {
          $scope.$apply(function() {
            ctrl.markActive();
          });
        });
      });
    };

    ctrl.discardEditing = function() {
      ctrl.writeValue = { raw: '' };
      ctrl.isEditing = false;
      EditableFieldsState.isBusy = false;
    };

    ctrl.isActive = function() {
      if (EditableFieldsState.forcedEditState) {
        return false;
      }
      return ctrl.field === EditableFieldsState.currentField;
    };

    ctrl.markActive = function() {
      commentStore.active = true;
      EditableFieldsState.currentField = ctrl.field;
    };

    if (!EditableFieldsState.forcedEditState) {
      $element.bind('keydown keypress', function(e) {
        if (e.keyCode === 27) {
          $scope.$apply(function() {
            ctrl.discardEditing();
          });
        }
      });
    }

    $scope.$on('workPackage.comment.quoteThis', function(evt, quote) {
      ctrl.startEditing(quote);
    });

    $scope.$on('inplaceEditMultiStorage.save.comment', function (event, promise) {
      promise.then(function() {
        ctrl.discardEditing();

        var nextActivity = ctrl.activities.length + 1;
        $location.hash('activity-' + (nextActivity));
      });
    });
  }

  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    templateUrl: '/components/work-packages/directives/work-package-comment/' +
      'work-package-comment.directive.html',
    scope: {
      workPackage: '=',
      activities: '='
    },

    controllerAs: 'fieldController',
    bindToController: true,
    controller: commentFieldDirectiveController,

    link: function(scope, element) {
      $timeout(function() {
        AutoCompleteHelper.enableTextareaAutoCompletion(element.find('textarea'));
      });
    }
  };
}
