from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]  # ← Убедитесь, что это есть


class LoginView(APIView):
    permission_classes = [AllowAny]  # ← Убедитесь, что это есть
    
    def post(self, request):
        login = request.data.get('login')
        password = request.data.get('password')
        
        if not login or not password:
            return Response(
                {'error': 'Логин и пароль обязательны'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=login, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        
        return Response(
            {'error': 'Неверный логин или пароль'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Выход выполнен'})
        except Exception:
            return Response({'error': 'Неверный токен'}, status=400)

"""
class ProfileView(APIView):
    # Профиль в будущем
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
"""
