import React from 'react'
import {Logo} from '../Logo/Logo';
import WaitlistForm from '../WaitlistForm';
import Social from '../Social';
import {useDispatch, useSelector} from 'react-redux';
import {setReferralLink, User} from '../../store/userSlice';
import {setSlug, setSecret, setRank, setConfirmed} from '../../store/userSlice';
import {Service, setLoading, setError, setLinkType} from '../../store/serviceSlice';
import axios from 'axios';
import styles from './HomeScreen.module.scss'
import CopyReferralLink from '../CopyReferralLink';
import Spinner from '../Spinner';

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [referrer, setReferrer] = React.useState<string | undefined>(undefined)
  // const [urlPaths, setUrlPaths] = React.useState<string[] | undefined>(undefined)
  const isEmailSent = useSelector((state: User) => state.user.isEmailSent)
  const rank = useSelector((state: User) => state.user.rank)
  const loading = useSelector((state: Service) => state.service.loading)
  const referralLink = useSelector((state: User) => state.user.referralLink)
  const error = useSelector((state: Service) => state.service.error)
  const url = new URL(window.location.href);

  React.useEffect(() => {
    const urlPaths = url.pathname.split('/').splice(1)
    switch (true) {
      case (urlPaths[0] === 'c'):
        dispatch(setSlug(urlPaths[1]))
        dispatch(setSecret(urlPaths[2]))
        axios.post(`${process.env.REACT_APP_API_URL}/waitlist/verify/`, {
          slug: urlPaths[1],
          secret: urlPaths[2]
        }).then((response) => {
          dispatch(setConfirmed(true))
          dispatch(setRank(response.data.position))
          dispatch(setReferralLink(response.data.reflink))
          dispatch(setLoading(false))
          return
        }).catch((error) => {
          if (error.response.data.error_code === 6) { //Already confirmed
            dispatch(setLinkType('waitlist'))
            axios.get(`${process.env.REACT_APP_API_URL}/waitlist/position/`, {
              params: { slug: urlPaths[1] },
            }).then((response) => {
              dispatch(setRank(response.data.position))
              dispatch(setReferralLink(response.data.reflink))
              window.history.pushState({}, 'Mover', `${url.origin}/w/${urlPaths[1]}/`);
              dispatch(setLoading(false))
            })
            return;
          }
          dispatch(setError(error.response.data.error))
          return
        })
        break;
      case urlPaths[0] === 'r':
        dispatch(setLinkType('referral'))
        setReferrer(urlPaths[1])
        dispatch(setLoading(false))
        break;
      case urlPaths[0] === 'w':
        axios.get(`${process.env.REACT_APP_API_URL}/waitlist/position/`, {
          params: {slug: urlPaths[1]},
        }).then((response) => {
          dispatch(setRank(response.data.position))
          dispatch(setReferralLink(response.data.reflink))
          window.history.pushState({}, 'Mover', `${url.origin}/w/${urlPaths[1]}/`);
          setLoading(false)
        }).catch((error) => {
          console.log('!!! error:', error)
          dispatch(setLoading(false))
        })
        break;
      default: {
        dispatch(setLinkType('root'))
        dispatch(setLoading(false))
      }
    }
  },[])

  return (
    <div className={styles.home}>
      <Logo className={styles.logo}/>
      <div className={styles.container}>
        {loading ? <Spinner/> : (
          isEmailSent && !error ? (
            <>
              <h1 className={styles.title}>Thanks for signing up!</h1>
              <p className={styles.text}>
                A verification email has been sent to you.
                <br/>Please verify your email to secure your
                spot on the waitlist.</p>
            </>
          ) : (
            <div>
              { rank ?
                <>
                  <p className={styles.text}>Skip ahead in line by referring friends<br/>using the link below.</p>
                  <div className={styles.rank}>Your rank: <span>{rank}</span></div>
                </>
                :
                <>
                  <h1 className={styles.title}>The first Aptos bridge</h1>
                  <p className={styles.text}>
                    Join the waitlist to be the first
                    <br/>
                    to access our Private Alpha
                  </p>
                </>
              }
              { referralLink ?
                <CopyReferralLink className={styles.form}/>
                :
                <WaitlistForm
                  fromReferral={referrer}
                  error={error}
                  className={styles.form}
                />
              }
            </div>
          )
        )}
      </div>

      <Social networks={['discord', 'github', 'twitter']} className={styles.social}/>
    </div>
  )
}

export default React.memo(HomeScreen)
