import { Alert, BackTop, Form, Spin } from "antd"
import React, { Suspense, useMemo } from "react"
import { FormContext, useTask } from "../hooks/useTask"
import { useContext } from "react";
import { FormHeader } from "./FormHeader";
import { OpinionArea } from "./OpinionArea";
import { OpinionAreaNewStyle } from "./OpinionAreaNewStyle";
import { getErrorMessage } from "../messageBox";
import { isSSR } from "../Commmon/consts";
import { useFormQueryString } from "../hooks/useFormQueryString";
import { ErrorModel } from "../WorkFlowApi";
import 'bootstrap/dist/css/bootstrap.css'
import { SelectUsersModalEx } from "./SelectUsersModalEx";

const FormPage = ({ children }: { children: any }) => {
    const SelectUsersModal = useMemo(() => React.lazy(() => import('./SelectUsersModal')), [])
    const useTaskResult = useContext(FormContext)
    const { prodefKey, mode } = useFormQueryString()

    return <div className="container">

        {useTaskResult?.task.error && <Alert
            message="加载公文出现错误"
            description={(useTaskResult.task.error instanceof ErrorModel) ? useTaskResult.task.error.error?.message : useTaskResult.task.error.message}
            type="error"
            showIcon
        />}

        {useTaskResult?.task.error === undefined && <>
            <FormHeader />
            <div>
                {
                    (useTaskResult?.task.value !== undefined) ? <div>
                        {children}
                    </div> : <></>
                }

                {prodefKey !== "CCSP" && prodefKey !== "FWGL" && prodefKey !== "BGSSW" && prodefKey !== "IPM.WF.XFWGL" && prodefKey !== "IPM.WF.XBGSSW" ? <div className="mb-2">
                    <OpinionArea />
                </div> : <></>}

                {mode === 'todo' && prodefKey === "CCSP" ? <div className="mb-2">
                    <OpinionAreaNewStyle />
                </div> : <></>}


                <div style={{ height: 10 }}></div>

                {mode === 'todo' ? <div className="text-center">
                    {
                        isSSR === false ? <Suspense fallback={<></>}><SelectUsersModal /></Suspense> : <></>
                    }
                </div> : <></>}

                {/* {mode === 'todo' ? <div className="text-center">
                    {
                        isSSR === false ? <Suspense fallback={<></>}><SelectUsersModalEx /></Suspense> : <></>
                    }
                </div> : <></>} */}


                {prodefKey === "QJGL" ? <p>
                    <hr />
                    <Form.Item label="请(休)假审批权限及流程">
                        <p>
                            一、局管二级巡视员<br />
                            个人申请→人事处审核→局主要领导审批。<br />
                            二、处室、直属单位党政主要负责人、正处长级干部<br />
                            个人申请→人事处审核→分管局领导意见→局主要领导审批。<br />
                            三、局机关、直属单位副处长级干部，局机关、直属行政机构一至四级调研员（不担任处级领导职务），局机关、直属行政机构、服务中心、信息中心、消保中心（消委会秘书处）、研究所、投诉举报中心一级主任科员及以下工作人员<br />
                            个人申请→人事处审核→处室（单位）主要负责人意见→分管局领导审批。<br />
                            备注：<br />
                            1.请（休）假应履行申报手续，填写审批表,确因急事急病来不及办理请（休）假手续的，应在请(休)假前按审批权限向对应的领导口头报告,同时告知人事部门,原则上在请（休）假开始的3天内补办手续；<br />
                            2.请（休）假结束后，应在2天内销假，并通过OA系统送人事处备案；<br />
                            3.休产假、男方护理假（生育子女），须提供医疗机构出具的生育相关证明；<br />
                            4.休护理父母假，须提供独生子女相关证明、医疗机构出具的父母住院证明；<br />
                            5.请病假，需提供医疗机构证明，无法提供医疗机构证明的，算事假；<br />
                            6.年内请事假需先用完公休假后再请事假。<br />
                        </p>
                    </Form.Item>
                </p> : <></>}
            </div>
        </>}
    </div>
}

export default FormPage