﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using BForms.Docs.Areas.Demo.Models;
using BForms.Docs.Areas.Demo.Repositories;
using BForms.Docs.Controllers;
using BForms.Docs.Helpers;
using BForms.Docs.Resources;
using BootstrapForms.Grid;
using BootstrapForms.Models;
using BootstrapForms.Mvc;

namespace BForms.Docs.Areas.Demo.Controllers
{
    public class GridController : BaseController
    {
        #region Properties and Constructor
        private readonly GridRepository _gridRepository;

        public GridController()
        {
            _gridRepository = new GridRepository(Db);
        }
        #endregion

        #region Pages
        public ActionResult Index()
        {
            var gridModel = _gridRepository.ToBsGridViewModel(new BsGridRepositorySettings<UsersSearchModel>
            {
                Page = 1,
                PageSize = 5
            });

            var model = new UsersViewModel
            {
                Grid = gridModel,
                Toolbar = new Toolbar<UsersSearchModel, UsersNewModel>
                {
                    Search = _gridRepository.GetSearchForm(),
                    New = _gridRepository.GetNewForm()
                }
            };

            var options = new Dictionary<string, string>
            {
                {"pagerUrl", Url.Action("Pager")},
                {"detailsUrl", Url.Action("Details")},
                {"getRowUrl", Url.Action("GetRow")},
                {"enableDisableUrl", Url.Action("EnableDisable")},
                {"newUrl", Url.Action("New")},
                {"deleteUrl", Url.Action("Delete")}
            };

            RequireJsOptions.Add("index", options);

            return View(model);
        }
        #endregion

        #region Ajax
        public JsonResult Pager(BsGridRepositorySettings<UsersSearchModel> model)
        {
            var msg = string.Empty;
            var msgToolTip = string.Empty;
            var status = StatusInfo.Success;
            var html = string.Empty;
            var count = 0;

            try
            {
                var viewModel = _gridRepository.ToBsGridViewModel<UsersViewModel>(x => x.Grid, model, out count);

                html = this.BsRenderPartialView("_Grid", viewModel);
            }
            catch (Exception ex)
            {
                msg = Resource.ServerError;
                status = StatusInfo.ServerError;
            }

            return Json(new
            {
                Status = status,
                Message = msg,
                MessageToolTip = msgToolTip,
                Data = new
                {
                    Count = count,
                    Html = html
                }
            });
        }

        public JsonResult New(Toolbar<UsersSearchModel, UsersNewModel> model)
        {
            var msg = string.Empty;
            var msgToolTip = string.Empty;
            var status = StatusInfo.Success;
            var row = string.Empty;

            try
            {
                var rowModel = _gridRepository.Create(model.New);

                var viewModel = _gridRepository.ToBsGridViewModel<UsersViewModel>(x => x.Grid, rowModel);

                row = this.BsRenderPartialView("_Grid", viewModel);
            }
            catch (Exception ex)
            {
                msg = Resource.ServerError;
                status = StatusInfo.ServerError;
            }

            return Json(new
            {
                Data = new
                {
                    Row = row
                },
                Status = status,
                Message = msg,
                MessageToolTip = msgToolTip,
            });
        }

        public JsonResult GetRow(int objId, bool getDetails = false)
        {
            var msg = string.Empty;
            var msgToolTip = string.Empty;
            var status = StatusInfo.Success;
            var row = string.Empty;
            var details = string.Empty;

            try
            {
                var rowModel = _gridRepository.ReadRow(objId);

                var viewModel = _gridRepository.ToBsGridViewModel<UsersViewModel>(x => x.Grid, rowModel);

                row = this.BsRenderPartialView("_Grid", viewModel);

                if (getDetails)
                {
                    var detailsModel = _gridRepository.ReadDetails(objId);

                    details = this.BsRenderPartialView("_Details", detailsModel);
                }
                
            }
            catch (Exception ex)
            {
                msg = Resource.ServerError;
                status = StatusInfo.ServerError;
            }

            return Json(new
            {
                Data = new
                {
                    Row = row,
                    Details = details
                },
                Status = status,
                Message = msg,
                MessageToolTip = msgToolTip,
            });
        }

        public JsonResult Details(int objId)
        {
            var msg = string.Empty;
            var msgToolTip = string.Empty;
            var status = StatusInfo.Success;
            var html = string.Empty;

            try
            {
                var model = _gridRepository.ReadDetails(objId);

                html = this.BsRenderPartialView("_Details", model);
            }
            catch (Exception ex)
            {
                msg = Resource.ServerError;
                status = StatusInfo.ServerError;
            }

            return Json(new
            {
                Data = new
                {
                    Html = html
                },
                Status = status,
                Message = msg,
                MessageToolTip = msgToolTip,
            });
        }

        public JsonResult Delete(int objId)
        {
            var msg = string.Empty;
            var msgToolTip = string.Empty;
            var status = StatusInfo.Success;

            try
            {
                _gridRepository.Delete(objId);
            }
            catch (Exception ex)
            {
                msg = Resource.ServerError;
                status = StatusInfo.ServerError;
            }

            return Json(new
            {
                Status = status,
                Message = msg,
                MessageToolTip = msgToolTip,
            });
        }

        public JsonResult EnableDisable(int objId)
        {
            var msg = string.Empty;
            var msgToolTip = string.Empty;
            var status = StatusInfo.Success;

            try
            {
                _gridRepository.EnableDisable(objId);
            }
            catch (Exception ex)
            {
                msg = Resource.ServerError;
                status = StatusInfo.ServerError;
            }

            return Json(new
            {
                Status = status,
                Message = msg,
                MessageToolTip = msgToolTip,
            });
        }
        #endregion
    }
}