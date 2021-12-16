import { withPrefix } from 'gatsby';
import { Base64 } from "js-base64"
import axios from 'axios'
import { IFormAttachmentDto } from './../WorkFlowApi'
import { IUseTaskResult } from "./useTask";
import { messageBox } from "../messageBox";
import { notification } from 'antd';
import React from 'react';

declare type CMD = "enable" | "disable" | "disableall"
const wpsClientBaseUrl = "http://localhost:58890"
const wpsDeployaddonsName = "wps_app_wf"

const SendCMD = async (cmd: CMD) => {
    //let url = `http://192.168.1.3:8001/js/`
    let url = `${window.location.origin}${withPrefix('/wps-js-pages/')}`
    let rawData = {
        "cmd": cmd, //"enable", 启用， "disable", 禁用, "disableall", 禁用所有
        "name": wpsDeployaddonsName,
        "url": url,
        "addonType": "wps",
        "online": "true",
        "version": "9"
    }

    var json = JSON.stringify(rawData)
    var data = Base64.encode(json)
    console.log(data)

    //navigator.registerProtocolHandler(scheme, url);

    for (let index = 0; index < 3; index++) {
        try {
            console.log('尝试第' + (index + 1).toString() + '次启动WPS')
            await axios.post(`${wpsClientBaseUrl}/deployaddons/runParams`, data)
            return
        } catch (error) {
            console.log(error)
            console.log('尝试第' + (index + 1).toString() + '次启动WPS失败')
            window.location.assign('ksoWPSCloudSvr://start=RelayHttpServer')
        }
    }

    //alert('启动WPS失败，请查看系统是否安装了WPS')
}

export const deployaddonsWPS = () => {
    return SendCMD('enable')
}

export const openFileByWps = async (info: Info) => {
    SendCMD('enable').then(() => {
        axios.post(`${wpsClientBaseUrl}/version`).then(version => {
            const ver = version.data as string
            console.log('版本：' + ver)
            if (ver.trim().length === 0) {
                notification.error({
                    message: '当前的WPS版本不支持在线文档编辑，请点击下方链接下载安装最新版本',
                    description: React.createElement('a',
                        {
                            href: 'http://172.26.130.105/file/wps2019.exe',
                            target: "_blank"
                        }, 'http://172.26.130.105/file/wps2019.exe'),
                    duration: null
                })
                return
            }

            var obj: { name: string, function: string, info: Info } = {
                name: wpsDeployaddonsName,
                function: 'dispatch',
                info: info
            }

            var json = JSON.stringify(obj)
            var data = 'ksowebstartupwps://' + Base64.encode(json)
            console.log(data)


            axios.post(`${wpsClientBaseUrl}/wps/runParams`, data).then(function (res) {
                console.log(res)
            }).catch(function () {
                alert('打开WPS失败')
            })
        }).catch(err => {
            notification.error({ message: '获取wps版本号失败', duration: null })
        })
    })
}
