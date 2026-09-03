#!binbash

git restore .
git pull
npm run build
pm2 restart learnoo.app