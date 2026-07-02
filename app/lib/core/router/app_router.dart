import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/dashboard/screens/main_scaffold.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/market/screens/market_screen.dart';
import '../../features/schemes/screens/schemes_screen.dart';
import '../../features/community/screens/community_screen.dart';
import '../../features/community/screens/create_post_screen.dart';
import '../../features/community/screens/post_details_screen.dart';
import '../../features/community/models/post_model.dart';
import '../../features/machinery/screens/machinery_screen.dart';
import '../../features/machinery/screens/machine_details_screen.dart';
import '../../features/machinery/models/machine_model.dart';
import '../../features/messages/screens/messenger_screen.dart';
import '../../features/messages/screens/chat_window_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/edit_profile_screen.dart';
import '../../features/plant_doctor/screens/plant_doctor_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final isAuth = authState.isAuthenticated;
      final isLoginRoute = state.matchedLocation == '/login';

      if (!isAuth && !isLoginRoute) return '/login';
      if (isAuth && isLoginRoute) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/doctor',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const PlantDoctorScreen(),
      ),
      GoRoute(
        path: '/messenger',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const MessengerScreen(),
      ),
      GoRoute(
        path: '/chat/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => ChatWindowScreen(
          conversationId: state.pathParameters['id']!,
          chatName: (state.extra as String?) ?? 'Chat',
        ),
      ),
      GoRoute(
        path: '/machinery',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const MachineryScreen(),
      ),
      GoRoute(
        path: '/machinery/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => MachineDetailsScreen(machine: state.extra as MachineModel),
      ),
      GoRoute(
        path: '/community/create',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const CreatePostScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => MainScaffold(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: '/dashboard', builder: (c, s) => const DashboardScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/market', builder: (c, s) => const MarketScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/schemes', builder: (c, s) => const SchemesScreen())]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/community', 
              builder: (c, s) => const CommunityScreen(),
              routes: [
                GoRoute(path: 'details', builder: (c, s) => PostDetailsScreen(post: s.extra as PostModel)),
              ]
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/profile', 
              builder: (c, s) => const ProfileScreen(),
              routes: [
                GoRoute(path: 'edit', builder: (c, s) => const EditProfileScreen()),
              ]
            ),
          ]),
        ],
      ),
    ],
  );
});
