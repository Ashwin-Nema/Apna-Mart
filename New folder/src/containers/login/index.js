import './index.css'
import { useState } from 'react'
import { PATHS, axiosinstance } from '../../config'
import { authsetter, setprofile } from '../../actions'
import { useDispatch, useSelector } from 'react-redux'
import { Redirect } from 'react-router'
import { Modal, Alert } from 'react-bootstrap'
import * as yup from 'yup'
import ErrorRoundedIcon from '@material-ui/icons/ErrorRounded';
import { hidemodal, showmodalwithmessageandvariant } from '../../utils'

export const Login = ({ history }) => {
    const dispatch = useDispatch()

    const [Email, Changeemail] = useState("")
    const [Password, Changepassword] = useState("")
    const [errormessage, changeerrormessage] = useState("")

    const userprofile = useSelector(state => state.Profile)

    const [modal, showmodal] = useState(false)

    const schema = yup.object().shape({
        Password: yup.string().required(),
        Email: yup.string().email().required()
    })

    const submithandler = (e) => {
        e.preventDefault()
        changeerrormessage("")


        schema.validate({ Password, Email }, { abortEarly: false }).then(async userdata => {
            const response = await axiosinstance.post('/user/login', { ...userdata })

            if (response.data.error !== "") {
                dispatch(authsetter(" "))
                showmodalwithmessageandvariant(showmodal, response.data.error, changeerrormessage)
                return
            }

            const { Name, Email, Mobilenumber, Location } = response.data
            dispatch(authsetter(response.data.token))
            dispatch(setprofile({ Name, Email, Mobilenumber, Location }))

            const auth = { "Auth": response.data.token }
            axiosinstance.defaults.headers = auth
            history.push(PATHS.HOME)
            return

        }).catch(function (err) {
            showmodalwithmessageandvariant(showmodal, err.errors[0], changeerrormessage)
        })
    }

    return (
        <>
            {
                Object.keys(userprofile).length > 0 && <Redirect to={PATHS.HOME} />
            }

            <div className="row container-fluid mt-5">
                <div className="col-4"></div>
                <div className="col-6 container-fluid">
                    <div className="border p-5">
                        <h3 className="text-center mb-3">Login</h3>
                        <form onSubmit={submithandler}>

                            <label className="form-label">Email</label>
                            <input value={Email} onChange={(e) => Changeemail(e.target.value)} className="form-control mb-3" type="email" />

                            <label className="form-label">Password</label>
                            <input value={Password} onChange={(e) => Changepassword(e.target.value)} className="form-control mb-3" type="password" />

                            <div className="d-flex justify-content-center">
                                <button type="submit" className='btn btn-info text-center rounded-pill container-fluid loginupbutton'>
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="col-2"></div>
            </div>

            <Modal centered show={modal} contentClassName="modalwithoutcolor py-5" onHide={() => hidemodal(showmodal)}>
                <Alert>
                    <span className="d-flex justify-content-center ">
                        <ErrorRoundedIcon style={{ color: "red" }} />
                        <h5>{errormessage}</h5>
                    </span>

                </Alert>
            </Modal>

        </>
    )
}