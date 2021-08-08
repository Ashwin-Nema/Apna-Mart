import {PATHS} from '../config'
import Posts from '../components/Posts'
import Post from '../components/Post'
import Allposts from '../components/All posts'
import { Login } from '../containers/login'

const routes = [
    {exact:true, path:PATHS.HOME, component:Posts},
    {exact:true,path:PATHS.POST, component:Post},
    {exact:true, path:PATHS.POSTS,component:Allposts},
    {exact:true, path:PATHS.LOGIN, component:Login}
]

export default routes