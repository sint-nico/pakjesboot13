/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route, MatchFilters } from '@solidjs/router'
import { routeBase, PagesReRouter } from '@quick-vite/gh-pages-spa/solidjs'

import { AppRoot } from './app'
import { LandingPage } from './pages/landing-page'
import { NotFoundPage } from './pages/404'
import { Ending } from './pages/ending';
import { Scanner } from './pages/game';
import { MiniGame } from './pages/mini-game';
import { getLocationsFromCache } from './supabase';

// This should work because they shouldn't be here if not via the home page
const gameFilter: MatchFilters = {
  gameName(value: string){
	const locations = getLocationsFromCache();
	if (locations?.some(location => location.game === value)) return true;
	return false;
  },
};

export const routes = <Router base={routeBase()} root={AppRoot}>
	<PagesReRouter>
		<Route path="/zoeken/" component={Scanner} />
		<Route path="/gevonden/" component={Ending} />
		<Route path="/puzzle/:gameName" component={MiniGame} matchFilters={gameFilter} />
		<Route path="/" component={LandingPage} />
		<Route path="*404" component={NotFoundPage} />
	</PagesReRouter>
</Router>

render(() => routes, document.getElementById('root')!)