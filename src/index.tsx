/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route } from '@solidjs/router'
import { routeBase, PagesReRouter } from '@quick-vite/gh-pages-spa/solidjs'

import { AppRoot } from './app'
import { LandingPage } from './pages/landing-page'
import { NotFoundPage } from './pages/404'
import { Ending } from './pages/ending';
import { Scanner } from './pages/game';

export const routes = <Router base={routeBase()} root={AppRoot}>
	<PagesReRouter>
		<Route path="/zoeken/" component={Scanner} />
		<Route path="/gevonden/" component={Ending} />
		<Route path="/" component={LandingPage} />
		<Route path="*404" component={NotFoundPage} />
	</PagesReRouter>
</Router>

render(() => routes, document.getElementById('root')!)