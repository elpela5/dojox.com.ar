export function CafecitoButton() {
  return (
    <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
      <a 
        href='https://cafecito.app/elpela5' 
        rel='noopener' 
        target='_blank'
        className="transition-transform hover:scale-105"
      >
        <img 
          srcSet='https://cdn.cafecito.app/imgs/buttons/button_5.png 1x, https://cdn.cafecito.app/imgs/buttons/button_5_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_5_3.75x.png 3.75x' 
          src='https://cdn.cafecito.app/imgs/buttons/button_5.png' 
          alt='Invitame un café en cafecito.app'
          className="h-12"
        />
      </a>
    </div>
  );
}
